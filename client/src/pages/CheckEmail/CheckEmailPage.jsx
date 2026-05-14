import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export default function CheckEmailPage() {
  const { state } = useLocation();
  const email = state?.email ?? 'your email';

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '24px', background: '#f8fafc',
    }}>
      <div style={{
        background: '#fff', borderRadius: '24px', padding: '48px 36px',
        maxWidth: '420px', width: '100%', textAlign: 'center',
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📬</div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>
          Check your email
        </h1>
        <p style={{ color: '#475569', fontSize: '1rem', lineHeight: 1.6, margin: '0 0 8px' }}>
          We sent a confirmation link to
        </p>
        <p style={{ color: '#7c3aed', fontWeight: 700, fontSize: '1rem', margin: '0 0 24px' }}>
          {email}
        </p>
        <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 32px' }}>
          Click the link in that email to activate your account and start your journey. Check your spam folder if you don't see it.
        </p>
        <Link
          to="/login"
          style={{
            display: 'block', padding: '14px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            color: '#fff', borderRadius: '14px', textDecoration: 'none',
            fontWeight: 700, fontSize: '1rem',
          }}
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
