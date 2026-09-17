import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { reportError } from '../lib/errorReporting';

// Mobile had no error boundary at all -- an uncaught render error here
// falls straight through to a blank screen or native crash with zero
// visibility, unlike web's ErrorBoundary.jsx. Mirrors that component's
// shape (and now reports to Sentry the same way, when configured).
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
    reportError(error, { componentStack: info?.componentStack });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>An unexpected error occurred. Restarting the app usually fixes it.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => this.setState({ hasError: false })}>
          <Text style={styles.btnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF6EE', alignItems: 'center', justifyContent: 'center', padding: 24 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', color: '#2B1D14', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#7A6F63', textAlign: 'center', marginBottom: 24, maxWidth: 280 },
  btn: { backgroundColor: '#FF7A00', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
