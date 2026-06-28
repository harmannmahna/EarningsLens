import React, { useState, useEffect, useRef } from 'react';
import { analyzeTranscript, downloadBrief } from './services/api';
import SentimentGauge from '../../components/SentimentGauge';
import KeywordChart from '../../components/KeywordChart';
import ComparePanel from '../../components/ComparePanel';
import { FileText, TrendingUp, AlertTriangle, GitCompare, Download, Loader, ChevronRight } from 'lucide-react';

// ── Design tokens ──────────────────────────────────────────────────────────
const T = {
  bg:      '#0a1628',
  surface: '#0d1f3c',
  border:  '#1e3a5f',
  gold:    '#c9a84c',
  green:   '#00c48c',
  red:     '#ff4d4d',
  slate:   '#8892a4',
  text:    '#f0f2f5',
  mono:    "'IBM Plex Mono', monospace",
  sans:    "'Inter', sans-serif",
};

const TICKER_ITEMS = [
  'SENTIMENT ANALYSIS', 'QoQ COMPARISON', 'RISK FLAG DETECTION',
  'GUIDANCE EXTRACTION', 'PDF ANALYST BRIEF', 'KEYWORD FREQUENCY',
];

// ── Ticker tape ────────────────────────────────────────────────────────────
function TickerTape() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={{
      background: T.gold, overflow: 'hidden', whiteSpace: 'nowrap',
      padding: '5px 0', borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{
        display: 'inline-block',
        animation: 'ticker 22s linear infinite',
      }}>
        {items.map((item, i) => (
          <span key={i} style={{
            fontFamily: T.mono, fontSize: 11, fontWeight: 700,
            color: T.bg, marginRight: 48, letterSpacing: 1.5,
          }}>
            ◆ {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────
function Card({ title, icon: Icon, iconColor, children, style }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 12, padding: 20, marginBottom: 16, ...style,
    }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          {Icon && <Icon size={15} color={iconColor || T.gold} />}
          <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700,
            color: iconColor || T.gold, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            {title}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

// ── Sentence list ─────────────────────────────────────────────────────────
function SentenceList({ items, color }) {
  if (!items?.length) return <p style={{ color: T.slate, fontSize: 12 }}>None detected.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.slice(0, 4).map((s, i) => (
        <div key={i} style={{
          background: T.bg, borderLeft: `3px solid ${color}`,
          padding: '8px 12px', borderRadius: '0 6px 6px 0',
          color: T.text, fontSize: 12, lineHeight: 1.6,
        }}>
          {s}
        </div>
      ))}
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────
function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 16,
      background: T.bg, padding: 4, borderRadius: 8, border: `1px solid ${T.border}` }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          style={{
            flex: 1, padding: '7px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
            background: active === t.id ? T.gold : 'transparent',
            color: active === t.id ? T.bg : T.slate,
            fontFamily: T.mono, fontSize: 11, fontWeight: 700,
            letterSpacing: 0.8, transition: 'all 0.15s',
          }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const [transcript, setTranscript] = useState('');
  const [company, setCompany]       = useState('');
  const [ticker, setTicker]         = useState('');
  const [quarter, setQuarter]       = useState('');
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [dlLoading, setDlLoading]   = useState(false);
  const [error, setError]           = useState('');
  const [tab, setTab]               = useState('analysis');
  const rightRef = useRef(null);

  const handleAnalyze = async () => {
    if (!transcript.trim() || !company.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await analyzeTranscript({ transcript, company, ticker, quarter });
      setResult(res);
      setTimeout(() => rightRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    } catch {
      setError('Could not reach backend. Make sure it is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDlLoading(true);
    try { await downloadBrief({ transcript, company, ticker, quarter }); }
    catch { setError('PDF generation failed.'); }
    finally { setDlLoading(false); }
  };

  const sampleLoad = () => {
    setCompany('Infosys Limited');
    setTicker('INFY');
    setQuarter('Q1 FY2026');
    setTranscript(`We are pleased to report a strong quarter with revenue growth of 18.4% year-over-year, 
exceeding our guidance range of 15 to 17 percent. EBITDA margin expanded by 140 basis points to 34.6 percent, 
driven by operational efficiencies and favorable currency tailwinds. Looking ahead, we raise our full year 
revenue guidance to 4.8 to 5.0 billion dollars, reflecting confidence in our pipeline and demand environment.
We remain cautiously optimistic about the macroeconomic backdrop, though we are mindful of ongoing 
inflationary pressure on discretionary IT spending. Geopolitical uncertainty in key European markets 
and potential headwinds from currency volatility warrant close monitoring. Supply chain challenges in 
our hardware segment persist but we expect resolution by Q3. Our cloud and digital transformation 
revenues grew 34 percent year-over-year, and large deal total contract value reached a record 3.2 billion 
dollars this quarter. We are confident in the momentum and the resilience of our business model.`);
  };

  return (
    <div style={{ fontFamily: T.sans, background: T.bg, minHeight: '100vh', color: T.text }}>
      {/* Ticker */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap');
        @keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } 
        ::-webkit-scrollbar-track { background: ${T.bg}; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
        textarea:focus, input:focus { outline: 1px solid ${T.gold}; }
        button:disabled { cursor: not-allowed; }
      `}</style>

      <TickerTape />

      {/* Header */}
      <div style={{
        padding: '16px 32px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, background: T.gold, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={18} color={T.bg} />
          </div>
          <div>
            <div style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 18, color: T.text, letterSpacing: 1 }}>
              EarningsLens
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.slate, letterSpacing: 1 }}>
              EARNINGS CALL INTELLIGENCE PLATFORM
            </div>
          </div>
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.slate }}>
          {new Date().toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric' }).toUpperCase()}
        </div>
      </div>

      {/* Two-panel layout */}
      <div style={{ display: 'flex', height: 'calc(100vh - 95px)' }}>

        {/* LEFT — Input panel */}
        <div style={{
          width: 380, flexShrink: 0, borderRight: `1px solid ${T.border}`,
          padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0,
        }}>
          <Card title="Company Details" icon={FileText}>
            <input value={company} onChange={e => setCompany(e.target.value)}
              placeholder="Company name *"
              style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`,
                borderRadius: 8, color: T.text, padding: '9px 12px',
                fontFamily: T.mono, fontSize: 12, marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={ticker} onChange={e => setTicker(e.target.value)}
                placeholder="Ticker (optional)"
                style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`,
                  borderRadius: 8, color: T.text, padding: '9px 12px',
                  fontFamily: T.mono, fontSize: 12 }} />
              <input value={quarter} onChange={e => setQuarter(e.target.value)}
                placeholder="Q1 2026"
                style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`,
                  borderRadius: 8, color: T.text, padding: '9px 12px',
                  fontFamily: T.mono, fontSize: 12 }} />
            </div>
          </Card>

          <Card title="Earnings Transcript" icon={FileText} iconColor={T.green}>
            <textarea value={transcript} onChange={e => setTranscript(e.target.value)}
              placeholder="Paste the earnings call transcript here..."
              style={{
                width: '100%', minHeight: 220, background: T.bg,
                border: `1px solid ${T.border}`, borderRadius: 8, color: T.text,
                padding: '10px 12px', fontFamily: T.mono, fontSize: 11,
                lineHeight: 1.6, resize: 'vertical',
              }} />
            <button onClick={sampleLoad}
              style={{
                marginTop: 8, background: 'transparent', border: `1px solid ${T.border}`,
                color: T.slate, borderRadius: 6, padding: '6px 12px',
                fontFamily: T.mono, fontSize: 10, cursor: 'pointer', letterSpacing: 0.8,
              }}>
              ↓ Load Sample Transcript
            </button>
          </Card>

          <button onClick={handleAnalyze}
            disabled={loading || !transcript.trim() || !company.trim()}
            style={{
              width: '100%', padding: '13px 0', background: T.gold,
              color: T.bg, border: 'none', borderRadius: 10,
              fontFamily: T.mono, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', letterSpacing: 1, display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: (loading || !transcript.trim() || !company.trim()) ? 0.5 : 1,
            }}>
            {loading
              ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</>
              : <><ChevronRight size={14} /> Run Analysis</>}
          </button>

          {error && (
            <div style={{
              marginTop: 12, background: '#1a0a0a', border: `1px solid ${T.red}33`,
              borderRadius: 8, padding: '10px 14px', color: T.red, fontSize: 12, fontFamily: T.mono,
            }}>
              {error}
            </div>
          )}
        </div>

        {/* RIGHT — Results panel */}
        <div ref={rightRef} style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
          {!result && !loading && (
            <div style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <TrendingUp size={48} color={T.border} />
              <div style={{ fontFamily: T.mono, color: T.slate, fontSize: 13, textAlign: 'center' }}>
                Paste a transcript and hit Run Analysis<br />
                <span style={{ fontSize: 11, color: T.border }}>
                  Detects sentiment · flags risks · extracts guidance · generates PDF brief
                </span>
              </div>
            </div>
          )}

          {loading && (
            <div style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 16,
            }}>
              <div style={{ fontFamily: T.mono, color: T.gold, fontSize: 13 }}>
                Processing transcript...
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, background: T.gold, borderRadius: '50%',
                    animation: `pulse 1s ease-in-out ${i * 0.2}s infinite alternate`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {result && (
            <>
              {/* Summary bar */}
              <div style={{
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 12, padding: '14px 20px', marginBottom: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
              }}>
                <div>
                  <div style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 16 }}>{result.company}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.slate }}>
                    {result.ticker && `${result.ticker} · `}{result.quarter}
                  </div>
                </div>
                <button onClick={handleDownload} disabled={dlLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    background: 'transparent', border: `1px solid ${T.gold}`,
                    color: T.gold, borderRadius: 8, padding: '8px 16px',
                    fontFamily: T.mono, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    opacity: dlLoading ? 0.6 : 1,
                  }}>
                  <Download size={13} />
                  {dlLoading ? 'Generating...' : 'Download Analyst Brief PDF'}
                </button>
              </div>

              <Tabs
                tabs={[
                  { id: 'analysis', label: 'Analysis' },
                  { id: 'keywords', label: 'Keywords' },
                  { id: 'compare', label: 'QoQ Compare' },
                ]}
                active={tab}
                onChange={setTab}
              />

              {tab === 'analysis' && (
                <>
                  {/* Sentiment gauge */}
                  <Card title="Management Tone" icon={TrendingUp}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <SentimentGauge sentiment={result.sentiment} />
                    </div>
                    <p style={{
                      background: T.bg, borderRadius: 8, padding: '12px 14px',
                      color: T.slate, fontSize: 12, lineHeight: 1.7, margin: '16px 0 0',
                      borderLeft: `3px solid ${T.gold}`,
                    }}>
                      {result.summary}
                    </p>
                  </Card>

                  {/* Positive phrases */}
                  {result.sentiment.top_positive_phrases?.length > 0 && (
                    <Card title="Bullish Language Detected" icon={TrendingUp} iconColor={T.green}>
                      <SentenceList items={result.sentiment.top_positive_phrases} color={T.green} />
                    </Card>
                  )}

                  {/* Guidance */}
                  <Card title="Forward Guidance Statements" icon={ChevronRight} iconColor={T.gold}>
                    <SentenceList items={result.guidance_sentences} color={T.gold} />
                  </Card>

                  {/* Risks */}
                  <Card title="Risk Flags" icon={AlertTriangle} iconColor={T.red}>
                    <SentenceList items={result.risk_sentences} color={T.red} />
                  </Card>

                  {/* Revenue */}
                  <Card title="Financial Highlights" icon={TrendingUp} iconColor={T.green}>
                    <SentenceList items={result.revenue_mentions} color={T.green} />
                  </Card>
                </>
              )}

              {tab === 'keywords' && (
                <Card title="Keyword Frequency by Category" icon={FileText}>
                  <KeywordChart keywords={result.keywords} />
                  {/* Full keyword table */}
                  <div style={{ marginTop: 20 }}>
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 80px 80px',
                      padding: '6px 12px', background: T.bg,
                      borderRadius: '6px 6px 0 0', marginBottom: 2,
                    }}>
                      {['Keyword', 'Category', 'Count'].map(h => (
                        <span key={h} style={{ fontFamily: T.mono, fontSize: 10, color: T.slate,
                          textTransform: 'uppercase', letterSpacing: 1 }}>{h}</span>
                      ))}
                    </div>
                    {result.keywords.map((k, i) => (
                      <div key={i} style={{
                        display: 'grid', gridTemplateColumns: '1fr 80px 80px',
                        padding: '7px 12px',
                        background: i % 2 === 0 ? T.bg : T.surface,
                        borderRadius: i === result.keywords.length - 1 ? '0 0 6px 6px' : 0,
                      }}>
                        <span style={{ color: T.text, fontSize: 12, fontFamily: T.mono }}>{k.word}</span>
                        <span style={{ fontSize: 11, fontFamily: T.mono,
                          color: k.category === 'risk' ? T.red : k.category === 'guidance' ? T.gold : T.green,
                          textTransform: 'capitalize' }}>{k.category}</span>
                        <span style={{ color: T.slate, fontSize: 12, fontFamily: T.mono }}>{k.count}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {tab === 'compare' && (
                <Card title="Quarter-over-Quarter Comparison" icon={GitCompare} iconColor={T.gold}>
                  <ComparePanel currentData={{ transcript, company, ticker, quarter }} />
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}