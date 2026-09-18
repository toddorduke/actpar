import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

// RN has no CSS shimmer-gradient equivalent without pulling in a native
// dependency (react-native-linear-gradient) -- a pulsing opacity via the
// Animated API gets the same "this is loading" signal with zero new deps.
export default function Skeleton({ width = '100%', height = 16, radius = 6, style }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: '#eee6da', opacity }, style]}
    />
  );
}

// Matches each screen's real post-card layout (avatar + name/time line +
// a couple text lines + action row) so the first paint already has the
// right shape before data arrives.
export function PostCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Skeleton width={44} height={44} radius={999} />
        <View style={styles.headerLines}>
          <Skeleton width="40%" height={14} />
          <Skeleton width="25%" height={11} style={{ marginTop: 6 }} />
        </View>
      </View>
      <Skeleton width="95%" height={14} style={{ marginTop: 14 }} />
      <Skeleton width="80%" height={14} style={{ marginTop: 8 }} />
      <View style={styles.actions}>
        <Skeleton width={50} height={12} />
        <Skeleton width={50} height={12} />
      </View>
    </View>
  );
}

export function FeedSkeleton({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => <PostCardSkeleton key={i} />)}
    </>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLines: { flex: 1 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
});
