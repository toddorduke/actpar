import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useConversations } from '../../hooks/useConversations.js';
import { useDirectMessages } from '../../hooks/useDirectMessages.js';
import { useBlock } from '../../hooks/useBlock.js';
import { supabase } from '../../lib/supabase.js';
import Avatar from '../../components/common/Avatar.jsx';
import './MessagesPage.css';

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ── Conversation List ─────────────────────────────────────────────────────────
function ConversationList({ conversations, selectedId, onSelect, onNewMessage, loading }) {
  return (
    <div className="conv-list">
      <div className="conv-list-header">
        <h2 className="conv-list-title">Messages</h2>
        <button className="new-msg-btn" onClick={onNewMessage} title="New message">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      {loading && <p className="conv-empty">Loading...</p>}

      {!loading && conversations.length === 0 && (
        <div className="conv-empty">
          <p>No messages yet.</p>
          <p>Message a connection to get started!</p>
        </div>
      )}

      {conversations.map((conv) => {
        const name = conv.partner
          ? `${conv.partner.first_name ?? ''} ${conv.partner.last_name ?? ''}`.trim() || 'User'
          : 'User';
        const preview = conv.lastMessage?.isMine
          ? `You: ${conv.lastMessage.content}`
          : conv.lastMessage?.content ?? '';
        return (
          <button
            key={conv.partnerId}
            className={`conv-item${selectedId === conv.partnerId ? ' active' : ''}${conv.unread > 0 ? ' unread' : ''}`}
            onClick={() => onSelect(conv.partnerId)}
          >
            <Avatar url={conv.partner?.avatar_url} name={name} size={46} />
            <div className="conv-item-info">
              <div className="conv-item-top">
                <span className="conv-item-name">{name}</span>
                <span className="conv-item-time">{timeAgo(conv.lastMessage?.created_at)}</span>
              </div>
              <div className="conv-item-preview">
                <span className="conv-preview-text">{preview.slice(0, 55)}{preview.length > 55 ? '...' : ''}</span>
                {conv.unread > 0 && <span className="conv-unread-badge">{conv.unread}</span>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Message Thread ─────────────────────────────────────────────────────────────
function MessageThread({ otherUserId, onBack }) {
  const { user } = useContext(AuthContext);
  const { messages, otherProfile, loading, sendMessage } = useDirectMessages(otherUserId);
  const { isBlocked } = useBlock();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    setText('');
    await sendMessage(text);
    setSending(false);
  }

  const otherName = otherProfile
    ? `${otherProfile.first_name ?? ''} ${otherProfile.last_name ?? ''}`.trim() || 'User'
    : 'User';

  return (
    <div className="thread-container">
      <div className="thread-header">
        {onBack && (
          <button className="thread-back-btn" onClick={onBack}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <Link to={`/profile/${otherUserId}`} className="thread-header-link">
          <Avatar url={otherProfile?.avatar_url} name={otherName} size={38} />
        </Link>
        <div className="thread-header-info">
          <Link to={`/profile/${otherUserId}`} className="thread-header-name thread-header-link">{otherName}</Link>
          {otherProfile?.alter_ego_name && (
            <div className="thread-header-ego">⚡ {otherProfile.alter_ego_name}</div>
          )}
        </div>
      </div>

      <div className="thread-messages">
        {loading && <p className="thread-loading">Loading messages...</p>}
        {!loading && messages.length === 0 && (
          <div className="thread-empty">
            <Avatar url={otherProfile?.avatar_url} name={otherName} size={64} />
            <p className="thread-empty-name">{otherName}</p>
            {otherProfile?.tagline && <p className="thread-empty-tagline">"{otherProfile.tagline}"</p>}
            <p className="thread-empty-hint">Say hello to start the conversation!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine = msg.sender_id === user?.id;
          const showTime = i === messages.length - 1
            || new Date(messages[i + 1]?.created_at) - new Date(msg.created_at) > 300000;
          return (
            <div key={msg.id} className={`msg-row${isMine ? ' mine' : ' theirs'}`}>
              {!isMine && (
                <Avatar url={msg.sender?.avatar_url} name={otherName} size={28} />
              )}
              <div className="msg-bubble-wrap">
                <div className={`msg-bubble${isMine ? ' mine' : ' theirs'}`}>
                  {msg.content}
                </div>
                {showTime && (
                  <div className={`msg-time${isMine ? ' mine' : ''}`}>{formatTime(msg.created_at)}</div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {isBlocked(otherUserId) ? (
        <div className="thread-blocked-bar">
          You have blocked this person. <Link to={`/profile/${otherUserId}`}>Unblock</Link> to message them.
        </div>
      ) : (
        <form className="thread-input-bar" onSubmit={handleSend}>
          <input
            className="thread-input"
            placeholder={`Message ${otherName}...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
            autoFocus
          />
          <button className="thread-send-btn" type="submit" disabled={!text.trim() || sending}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      )}
    </div>
  );
}

// ── New Message Modal ──────────────────────────────────────────────────────────
function NewMessageModal({ onClose, onSelect }) {
  const { user } = useContext(AuthContext);
  const [connections, setConnections] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('connections')
        .select('requester_id, receiver_id')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted');

      const partnerIds = (data ?? []).map((c) =>
        c.requester_id === user.id ? c.receiver_id : c.requester_id
      );

      if (partnerIds.length === 0) { setConnections([]); return; }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, alter_ego_name')
        .in('id', partnerIds);

      setConnections(profiles ?? []);
    }
    load();
  }, [user]);

  const filtered = connections.filter((p) => {
    const name = `${p.first_name ?? ''} ${p.last_name ?? ''}`.toLowerCase();
    return !search || name.includes(search.toLowerCase());
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="new-msg-modal">
        <div className="new-msg-modal-header">
          <h2>New Message</h2>
          <button className="new-msg-close" onClick={onClose}>×</button>
        </div>
        <input
          className="new-msg-search"
          placeholder="Search connections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <div className="new-msg-list">
          {filtered.length === 0 && (
            <p className="new-msg-empty">
              {connections.length === 0 ? 'Connect with people first to message them.' : 'No matches.'}
            </p>
          )}
          {filtered.map((p) => {
            const name = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'User';
            return (
              <button key={p.id} className="new-msg-person" onClick={() => { onSelect(p.id); onClose(); }}>
                <Avatar url={p.avatar_url} name={name} size={42} />
                <div className="new-msg-person-info">
                  <div className="new-msg-person-name">{name}</div>
                  {p.alter_ego_name && <div className="new-msg-person-ego">⚡ {p.alter_ego_name}</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('with');
  const { conversations, loading, refetch } = useConversations();
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [mobileView, setMobileView] = useState(selectedId ? 'thread' : 'list');

  function selectConversation(userId) {
    setSearchParams({ with: userId });
    setMobileView('thread');
  }

  function handleBack() {
    setSearchParams({});
    setMobileView('list');
    refetch();
  }

  return (
    <div className="messages-page">
      <div className={`messages-layout${selectedId ? ' has-thread' : ''}`}>
        {/* Left: conversation list */}
        <div className={`messages-left${mobileView === 'thread' ? ' mobile-hidden' : ''}`}>
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={selectConversation}
            onNewMessage={() => setShowNewMsg(true)}
            loading={loading}
          />
        </div>

        {/* Right: thread or empty state */}
        <div className={`messages-right${mobileView === 'list' ? ' mobile-hidden' : ''}`}>
          {selectedId ? (
            <MessageThread
              key={selectedId}
              otherUserId={selectedId}
              onBack={handleBack}
            />
          ) : (
            <div className="thread-empty-state">
              <div className="thread-empty-icon">💬</div>
              <h2 className="thread-empty-title">Your Messages</h2>
              <p className="thread-empty-desc">Select a conversation or start a new one with a connection.</p>
              <button className="thread-empty-new-btn" onClick={() => setShowNewMsg(true)}>
                + New Message
              </button>
            </div>
          )}
        </div>
      </div>

      {showNewMsg && (
        <NewMessageModal
          onClose={() => setShowNewMsg(false)}
          onSelect={selectConversation}
        />
      )}
    </div>
  );
}
