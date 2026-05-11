import { useCallback, useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';
import { checkText, validateFileType, validateFileSize, scanMediaUrl } from '../utils/contentModeration.js';

export const useMedia = () => {
  const { user } = useContext(AuthContext);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMedia = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('media')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setMedia(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  const uploadFile = useCallback(async ({ file, caption, visibility, shareTo }) => {
    if (!user) return { error: new Error('Not authenticated') };

    // File type + size validation
    const typeCheck = validateFileType(file);
    if (!typeCheck.ok) return { error: new Error(typeCheck.message) };

    const sizeCheck = validateFileSize(file);
    if (!sizeCheck.ok) return { error: new Error(sizeCheck.message) };

    // Caption moderation
    if (caption) {
      const captionCheck = checkText(caption);
      if (!captionCheck.ok) return { moderation: captionCheck };
    }

    // Build a unique file path
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('media')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (storageError) return { error: storageError };

    // Get public URL
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
    const fileUrl = urlData.publicUrl;

    // AI media scan (NSFW, violence, etc.)
    const mediaScan = await scanMediaUrl(fileUrl);
    if (!mediaScan.ok) {
      // Remove the uploaded file since it failed moderation
      await supabase.storage.from('media').remove([path]);
      return { error: new Error(mediaScan.message) };
    }

    // Determine file type
    const fileType = file.type.startsWith('video') ? 'video' : 'photo';

    // Save to media table
    const { data, error } = await supabase
      .from('media')
      .insert({
        user_id: user.id,
        file_url: fileUrl,
        file_type: fileType,
        caption: caption || null,
        visibility,
        share_to: shareTo ?? [],
      })
      .select()
      .single();

    if (!error) setMedia((prev) => [data, ...prev]);
    return { data, error };
  }, [user]);

  const deleteMedia = useCallback(async (id, fileUrl) => {
    // Extract storage path from URL
    const path = fileUrl.split('/media/')[1];
    if (path) await supabase.storage.from('media').remove([path]);

    const { error } = await supabase.from('media').delete().eq('id', id);
    if (!error) setMedia((prev) => prev.filter((m) => m.id !== id));
    return { error };
  }, []);

  const photos = media.filter((m) => m.file_type === 'photo');
  const videos = media.filter((m) => m.file_type === 'video');

  return { media, photos, videos, loading, uploadFile, deleteMedia, refetch: fetchMedia };
};
