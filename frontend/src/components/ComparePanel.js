import React, { useState } from 'react';
import { compareTranscripts } from '../services/api';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';

const card = {
  background: '#0d1f3c',
  border: '1px solid #1e3a5f',
  borderRadius: 10,
  padding: 16,
  marginBottom: 12,
};

export default function ComparePanel({ currentData }) {
  const [prevTranscript, setPrevTranscript] = useState('');
  const [prevQuarter, setPrevQuarter] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCompare = async () => {
    if (!prevTranscript.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await compareTranscripts({
        current: currentData,
        previous: { ...currentData, transcript: prevTranscript, quarter: prevQuarter },
      });
      setResult(res);
    } catch {
      setError('Comparison failed. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const DirIcon = result?.sentiment_direction === 'Improved' ? TrendingUp
    : result?.sentiment_direction === 'Declined' ? TrendingDown : Minus;
  const dirColor = result?.sentiment_direction === 'Improved' ? '#00c48c'
    : result?.sentiment_direction === 'Declined' ? '#ff4d4d' : '#c9a84c';

  return (
    <div>
      <p style={{ color: '#8892a4', fontSize: 12, marginBottom: 12, fontFamily: 'IBM Plex Mono' }}>
        Paste last quarter's transcript to detect sentiment shift
      </p>
      <textarea
        value={prevTranscript}
        onChange={e => setPrevTranscript(e.target.value)}
        placeholder="Paste previous quarter earnings transcript..."
        style={{
          width: '100%', minHeight: 100, background: '#071426',
          border: '1px solid #1e3a5f', borderRadius: 8, color: '#f0f2f5',
          padding: '10px 12px', fontFamily: 'IBM Plex Mono', fontSize: 12,
          resize: 'vertical', boxSizing: 'border-box',
        }}
      />
      <input
        value={prevQuarter}
        onChange={e => setPrevQuarter(e.target.value)}
        placeholder="Previous quarter (e.g. Q4 2025)"
        style={{
          width: '100%', background: '#071426', border: '1px solid #1e3a5f',
          borderRadius: 8, color: '#f0f2f5', padding: '8px 12px',
          fontFamily: 'IBM Plex Mono', fontSize: 12, marginTop: 8, boxSizing: 'border-box',
        }}
      />
      <button onClick={handleCompare} disabled={loading || !prevTranscript.trim()}
        style={{
          marginTop: 10, padding: '9px 20px', background: '#c9a84c',
          color: '#0a1628', border: 'none', borderRadius: 8,
          fontFamily: 'IBM Plex Mono', fontWeight: 700, fontSize: 13,
          cursor: 'pointer', opacity: loading ? 0.6 : 1,
        }}>
        {loading ? 'Comparing...' : 'Run QoQ Comparison'}
      </button>

      {error && <p style={{ color: '#ff4d4d', fontSize: 12, marginTop: 8 }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 20 }}>
          {/* Shift indicator */}
          <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 14 }}>
            <DirIcon size={28} color={dirColor} />
            <div>
              <div style={{ color: dirColor, fontFamily: 'IBM Plex Mono', fontWeight: 700, fontSize: 16 }}>
                Sentiment {result.sentiment_direction}
              </div>
              <div style={{ color: '#8892a4', fontSize: 12, fontFamily: 'IBM Plex Mono' }}>
                Δ {result.sentiment_shift > 0 ? '+' : ''}{result.sentiment_shift.toFixed(3)} QoQ
              </div>
            </div>
          </div>

          {/* New risks */}
          {result.new_risk_keywords?.length > 0 && (
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={14} color="#ff4d4d" />
                <span style={{ color: '#ff4d4d', fontFamily: 'IBM Plex Mono', fontSize: 12, fontWeight: 700 }}>
                  New Risk Flags This Quarter
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {result.new_risk_keywords.map((k, i) => (
                  <span key={i} style={{
                    background: '#1e0a0a', color: '#ff4d4d', border: '1px solid #ff4d4d33',
                    borderRadius: 4, padding: '2px 8px', fontFamily: 'IBM Plex Mono', fontSize: 11,
                  }}>{k}</span>
                ))}
              </div>
            </div>
          )}

          {/* Dropped risks */}
          {result.dropped_risk_keywords?.length > 0 && (
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <CheckCircle size={14} color="#00c48c" />
                <span style={{ color: '#00c48c', fontFamily: 'IBM Plex Mono', fontSize: 12, fontWeight: 700 }}>
                  Risks No Longer Mentioned
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {result.dropped_risk_keywords.map((k, i) => (
                  <span key={i} style={{
                    background: '#001a0f', color: '#00c48c', border: '1px solid #00c48c33',
                    borderRadius: 4, padding: '2px 8px', fontFamily: 'IBM Plex Mono', fontSize: 11,
                  }}>{k}</span>
                ))}
              </div>
            </div>
          )}

          {/* Analyst note */}
          <div style={{ ...card, borderLeft: `3px solid ${dirColor}` }}>
            <div style={{ color: '#c9a84c', fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
              ANALYST NOTE
            </div>
            <p style={{ color: '#f0f2f5', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              {result.analyst_note}
            </p>
          </div>

          <div style={{ ...card }}>
            <div style={{ color: '#8892a4', fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
              GUIDANCE CHANGE
            </div>
            <p style={{ color: '#f0f2f5', fontSize: 12, margin: 0 }}>{result.guidance_change}</p>
            <div style={{ color: '#8892a4', fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 700, marginTop: 10, marginBottom: 4 }}>
              CONFIDENCE TONE
            </div>
            <p style={{ color: '#f0f2f5', fontSize: 12, margin: 0 }}>{result.confidence_change}</p>
          </div>
        </div>
      )}
    </div>
  );
}