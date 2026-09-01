import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSignIn() {
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    if (signInError) setError(signInError.message);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ActPar</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleSignIn} disabled={submitting || !email || !password}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FBF6EE' },
  title: { fontSize: 32, fontWeight: '800', color: '#FF7A00', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#7A6F63', textAlign: 'center', marginBottom: 28 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb',
    padding: 14, fontSize: 15, marginBottom: 12,
  },
  button: { backgroundColor: '#FF7A00', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  error: { color: '#dc2626', marginBottom: 8, fontSize: 13 },
});
