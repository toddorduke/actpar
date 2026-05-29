import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f1117',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
        <h1 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '10px' }}>
          Something went wrong
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', marginBottom: '28px', maxWidth: '320px' }}>
          An unexpected error occurred. Refreshing usually fixes it.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: '#f59e0b',
            color: '#000',
            border: 'none',
            borderRadius: '20px',
            padding: '12px 28px',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Refresh page
        </button>
      </div>
    );
  }
}
