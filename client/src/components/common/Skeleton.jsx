import React from 'react';
import './Skeleton.css';

// A single shimmering placeholder block. Compose a few of these into a
// *Skeleton component shaped like the real content (see PostCardSkeleton
// below) rather than reaching for this bare -- a shape-matched skeleton
// reads as "this is loading," a stray gray rectangle reads as "this is
// broken."
export default function Skeleton({ width = '100%', height = 16, radius = 6, style }) {
  return <div className="skeleton-block" style={{ width, height, borderRadius: radius, ...style }} />;
}

// Matches PostCard's actual layout (avatar + name/time line + a couple
// text lines + action row) so the feed's first paint already has the
// right shape before any data arrives.
export function PostCardSkeleton() {
  return (
    <div className="skeleton-post-card">
      <div className="skeleton-post-header">
        <Skeleton width={44} height={44} radius={999} />
        <div className="skeleton-post-header-lines">
          <Skeleton width="40%" height={14} />
          <Skeleton width="25%" height={11} style={{ marginTop: 6 }} />
        </div>
      </div>
      <Skeleton width="95%" height={14} style={{ marginTop: 14 }} />
      <Skeleton width="80%" height={14} style={{ marginTop: 8 }} />
      <div className="skeleton-post-actions">
        <Skeleton width={60} height={12} />
        <Skeleton width={60} height={12} />
      </div>
    </div>
  );
}

// Renders `count` PostCardSkeletons in a row -- the common case for a
// feed's initial loading state.
export function FeedSkeleton({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => <PostCardSkeleton key={i} />)}
    </>
  );
}
