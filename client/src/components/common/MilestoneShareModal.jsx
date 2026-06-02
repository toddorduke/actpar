import React, { useRef, useEffect, useState } from 'react';
import './MilestoneShareModal.css';

const MESSAGES = {
  7:   "One week down. The habit is forming.",
  30:  "30 days. Most people quit by day 3.",
  60:  "Two months of showing up. That's rare.",
  90:  "90 days. You literally rewired your brain.",
};

function drawCard(canvas, { milestone, goalTitle, displayName, dateStr }) {
  const W = 1080, H = 1080;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0f1117';
  ctx.fillRect(0, 0, W, H);

  // Amber glow top-center
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, W * 0.7);
  glow.addColorStop(0, 'rgba(245,158,11,0.35)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Top bar
  ctx.fillStyle = 'rgba(245,158,11,0.15)';
  ctx.fillRect(0, 0, W, 6);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, W * 0.4, 6);

  // Flame emoji
  ctx.font = '120px serif';
  ctx.textAlign = 'center';
  ctx.fillText('🔥', W / 2, 240);

  // Streak number
  ctx.font = `900 ${milestone >= 100 ? 220 : 260}px system-ui, sans-serif`;
  ctx.fillStyle = '#f59e0b';
  ctx.textAlign = 'center';
  ctx.fillText(`${milestone}`, W / 2, 520);

  // "DAY STREAK" label
  ctx.font = '600 52px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.letterSpacing = '12px';
  ctx.fillText('DAY STREAK', W / 2, 600);
  ctx.letterSpacing = '0px';

  // Divider
  const grad = ctx.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
  grad.addColorStop(0, 'rgba(245,158,11,0)');
  grad.addColorStop(0.5, 'rgba(245,158,11,0.5)');
  grad.addColorStop(1, 'rgba(245,158,11,0)');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W * 0.2, 645);
  ctx.lineTo(W * 0.8, 645);
  ctx.stroke();

  // Goal title
  ctx.font = '700 48px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  const maxW = W * 0.75;
  const words = goalTitle.split(' ');
  let line = '', lines = [];
  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; }
    else line = test;
  }
  lines.push(line);
  lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, W / 2, 720 + i * 60));

  // Motivational message
  ctx.font = '400 38px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  const msg = MESSAGES[milestone] ?? 'Consistency is the key.';
  ctx.fillText(msg, W / 2, lines.length > 1 ? 860 : 820);

  // Name
  ctx.font = '600 36px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText(displayName, W / 2, lines.length > 1 ? 920 : 880);

  // ActPar branding bottom
  ctx.font = '700 32px system-ui, sans-serif';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('actpar.com', W / 2, 1020);

  // Date
  ctx.font = '400 28px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillText(dateStr, W / 2, 1055);
}

export default function MilestoneShareModal({ milestone, goalTitle, displayName, onClose }) {
  const canvasRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    if (canvasRef.current) {
      drawCard(canvasRef.current, { milestone, goalTitle, displayName, dateStr });
    }
  }, [milestone, goalTitle, displayName, dateStr]);

  async function handleShare() {
    setSharing(true);
    try {
      const blob = await new Promise((res) => canvasRef.current.toBlob(res, 'image/png'));
      const file = new File([blob], 'actpar-streak.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${milestone}-Day Streak on ActPar!`, text: `I just hit a ${milestone}-day streak on "${goalTitle}" 🔥 Join me at actpar.com` });
      } else {
        await navigator.share({ title: `${milestone}-Day Streak on ActPar!`, text: `I just hit a ${milestone}-day streak on "${goalTitle}" 🔥 Join me at actpar.com`, url: 'https://actpar.com' });
      }
    } catch {}
    setSharing(false);
  }

  function handleDownload() {
    setDownloading(true);
    const link = document.createElement('a');
    link.download = `actpar-${milestone}-day-streak.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    setDownloading(false);
  }

  return (
    <div className="ms-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ms-modal">
        <button className="ms-close" onClick={onClose}>✕</button>

        <div className="ms-card-wrap">
          <canvas ref={canvasRef} className="ms-canvas" />
        </div>

        <div className="ms-actions">
          <button className="ms-share-btn" onClick={handleShare} disabled={sharing}>
            {sharing ? 'Sharing…' : '🔗 Share'}
          </button>
          <button className="ms-download-btn" onClick={handleDownload} disabled={downloading}>
            {downloading ? '…' : '⬇️ Save'}
          </button>
        </div>

        <p className="ms-hint">Hold the image to save it to your photos</p>
      </div>
    </div>
  );
}
