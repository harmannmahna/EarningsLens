import React from 'react';

const LABEL_COLOR = {
  Bullish: '#00c48c',
  'Neutral-Positive': '#7ecba1',
  Neutral: '#c9a84c',
  Cautious: '#ff9a3c',
  Bearish: '#ff4d4d',
};

export default function SentimentGauge({ sentiment }) {
  if (!sentiment) return null;
  const { overall_score, confidence_score, caution_score, label } = sentiment;
  const color = LABEL_COLOR[label] || '#8892a4';

  // Convert score (-1 to +1) to angle (-90 to +90 degrees)
  const angle = overall_score * 90;
  const needleX = 80 + 60 * Math.sin((angle * Math.PI) / 180);
  const needleY = 80 - 60 * Math.cos((angle * Math.PI) / 180);

  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox="0 0 160 100" width="220" height="140">
        {/* Arc background segments */}
        {[
          { color: '#ff4d4d',  d: 'M 20 80 A 60 60 0 0 1 47 27' },
          { color: '#ff9a3c',  d: 'M 47 27 A 60 60 0 0 1 80 20' },
          { color: '#c9a84c',  d: 'M 80 20 A 60 60 0 0 1 113 27' },
          { color: '#7ecba1',  d: 'M 113 27 A 60 60 0 0 1 140 80' },
        ].map((seg, i) => (
          <path key={i} d={seg.d} stroke={seg.color} strokeWidth="10"
            fill="none" strokeLinecap="round" opacity="0.85" />
        ))}
        {/* Needle */}
        <line x1="80" y1="80" x2={needleX} y2={needleY}
          stroke="#f0f2f5" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="80" cy="80" r="5" fill={color} />
      </svg>

      <div style={{ fontFamily: "'IBM Plex Mono', monospace", color, fontSize: 22, fontWeight: 700, marginTop: -8 }}>
        {label}
      </div>
      <div style={{ color: '#8892a4', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", marginTop: 4 }}>
        score: {overall_score > 0 ? '+' : ''}{overall_score.toFixed(3)}
      </div>

      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 16 }}>
        <Stat label="Confidence" value={`${(confidence_score * 100).toFixed(0)}%`} color="#00c48c" />
        <Stat label="Caution" value={`${(caution_score * 100).toFixed(0)}%`} color="#ff9a3c" />
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color, fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 700 }}>{value}</div>
      <div style={{ color: '#8892a4', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    </div>
  );
}