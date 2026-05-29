import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFoundPage.css';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="nf-page">
      <div className="nf-code">404</div>
      <h1 className="nf-title">Page not found</h1>
      <p className="nf-desc">The link may be broken or the page may have moved.</p>
      <button className="nf-btn" onClick={() => navigate('/')}>Back to home</button>
    </div>
  );
}
