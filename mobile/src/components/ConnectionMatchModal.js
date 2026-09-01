import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Easing } from 'react-native';

// Mobile counterpart to client/src/components/common/ConnectedModal.jsx --
// the one deliberately "full-screen takeover" moment in the notification
// design (everything else stays a standard push). Same lightning-bolt/
// avatars motif for brand consistency, built with Animated since RN
// doesn't share web's CSS keyframe setup.
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  angle: (360 / 12) * i,
  distance: 70 + Math.random() * 40,
}));

export default function ConnectionMatchModal({ visible, myName, otherName, onMessage, onClose }) {
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.3);
    opacity.setValue(0);
    particleAnim.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.timing(particleAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [visible]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <View style={styles.particleField}>
            {PARTICLES.map((p, i) => {
              const tx = particleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos((p.angle * Math.PI) / 180) * p.distance] });
              const ty = particleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin((p.angle * Math.PI) / 180) * p.distance] });
              const fade = particleAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
              return (
                <Animated.Text key={i} style={[styles.particle, { opacity: fade, transform: [{ translateX: tx }, { translateY: ty }] }]}>⚡</Animated.Text>
              );
            })}
          </View>

          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}><Text style={styles.avatarInitial}>{(myName || 'Y')[0]}</Text></View>
            <Text style={styles.bolt}>⚡</Text>
            <View style={styles.avatarCircle}><Text style={styles.avatarInitial}>{(otherName || '?')[0]}</Text></View>
          </View>

          <Text style={styles.title}>You're Connected!</Text>
          <Text style={styles.sub}>You and {otherName || 'this person'} can now message each other and cheer each other on.</Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={onMessage}>
            <Text style={styles.primaryBtnText}>Send a Message</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}><Text style={styles.dismiss}>Keep Browsing</Text></TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(43,29,20,0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 360, alignItems: 'center' },
  particleField: { position: 'absolute', top: 90, alignSelf: 'center', width: 0, height: 0 },
  particle: { position: 'absolute', fontSize: 18, left: -9, top: -9 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FF7A00', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 28, fontWeight: '800' },
  bolt: { fontSize: 24 },
  title: { fontSize: 22, fontWeight: '800', color: '#2B1D14', marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 14, color: '#7A6F63', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  primaryBtn: { backgroundColor: '#FF7A00', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  dismiss: { color: '#7A6F63', fontSize: 13, fontWeight: '600' },
});
