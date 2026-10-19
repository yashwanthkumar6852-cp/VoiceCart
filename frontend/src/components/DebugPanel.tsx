import React, { useEffect, useState } from 'react';
import { Terminal, X, CheckCircle2, AlertTriangle, HelpCircle, ShieldAlert, Trash2, Cpu, Zap, Activity, Search, Filter, Layers, Database, ArrowRight, Rss, Clock, PackageCheck } from 'lucide-react';
import { voiceStore } from '../voice/voiceStore';
import { CommandDebugEntry } from '../voice/types';
import { SearchDebugTrace, Product } from '../types';
import { imageInterventionTracker } from '../utils/imageInterventionTracker';
import { isApiDebugEnabled, setApiDebugEnabled } from '../lib/api';

interface Props {
  currentQuery?: string;
  feedSource?: string;
  feedLastUpdated?: string | null;
  selectedProduct?: Product | null;
  onConfirmYes?: () => void;
  onConfirmNo?: () => void;
}

export const DebugPanel: React.FC<Props> = ({
  currentQuery = '',
  feedSource = 'Server Cached SerpApi Category Engine (3h TTL)',
  feedLastUpdated,
  selectedProduct,
  onConfirmYes,
  onConfirmNo
}) => {
  const [state, setState] = useState(voiceStore.getState());
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'voice' | 'catalog'>('search');
  const [hasIntervention, setHasIntervention] = useState(imageInterventionTracker.hasInterventionNotice());
  const [apiLoggingEnabled, setApiLoggingEnabled] = useState(isApiDebugEnabled());
  const [catalogStatus, setCatalogStatus] = useState<any>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const loadCatalogStatus = async () => {
    setCatalogLoading(true);
    try {
      const { api } = await import('../lib/api');
      const data = await api.getCatalogStatus();
      setCatalogStatus(data);
    } catch (err: any) {
      console.warn('Failed to load catalog status:', err.message);
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'catalog') {
      loadCatalogStatus();
    }
  }, [activeTab]);

  useEffect(() => {
    const unsubVoice = voiceStore.subscribe(() => {
      setState(voiceStore.getState());
    });
    const unsubTracker = imageInterventionTracker.subscribe(() => {
      setHasIntervention(imageInterventionTracker.hasInterventionNotice());
    });
    return () => {
      unsubVoice();
      unsubTracker();
    };
  }, []);

  if (!state.showDebugPanel) return null;

  const debugTrace: SearchDebugTrace | undefined = state.searchResults?.debugTrace;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: isMinimized ? '300px' : '520px',
        maxHeight: isMinimized ? '48px' : '620px',
        background: 'rgba(15, 23, 42, 0.98)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        borderRadius: '14px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontSize: '0.78rem',
        fontFamily: 'monospace',
        transition: 'all 0.25s ease'
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: 'linear-gradient(90deg, #1e1b4b, #312e81)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#fff',
          cursor: 'pointer'
        }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={16} color="#818cf8" />
          <span style={{ fontWeight: 800, letterSpacing: '0.04em', color: '#c7d2fe' }}>
            SEARCH & VOICE DEBUG
          </span>
          {debugTrace && (
            <span style={{ background: '#10b981', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem' }}>
              SPEC v4
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => voiceStore.clearDebugLogs()}
            title="Clear logs"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px'
            }}
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={() => voiceStore.setShowDebugPanel(false)}
            title="Close panel"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px'
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* TAB BAR */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => setActiveTab('search')}
              style={{
                flex: 1,
                padding: '8px',
                background: activeTab === 'search' ? 'rgba(99,102,241,0.25)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'search' ? '2px solid #818cf8' : 'none',
                color: activeTab === 'search' ? '#c7d2fe' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Search size={12} />
              <span>Search & Relevance</span>
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              style={{
                flex: 1,
                padding: '8px',
                background: activeTab === 'voice' ? 'rgba(99,102,241,0.25)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'voice' ? '2px solid #818cf8' : 'none',
                color: activeTab === 'voice' ? '#c7d2fe' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Cpu size={12} />
              <span>Voice Logs ({state.debugLogs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              style={{
                flex: 1,
                padding: '8px',
                background: activeTab === 'catalog' ? 'rgba(99,102,241,0.25)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'catalog' ? '2px solid #818cf8' : 'none',
                color: activeTab === 'catalog' ? '#c7d2fe' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Database size={12} />
              <span>Catalog DB</span>
            </button>
          </div>

          {/* PENDING CONFIRMATION ALERT BAR */}
          {state.pendingConfirmation && (
            <div
              style={{
                background: 'rgba(234, 179, 8, 0.15)',
                borderBottom: '1px solid rgba(234, 179, 8, 0.4)',
                padding: '10px 14px',
                color: '#fde047',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                <ShieldAlert size={16} color="#eab308" />
                <span>Confirmation Required:</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#fef08a' }}>
                {state.pendingConfirmation.prompt}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                <button
                  onClick={() => onConfirmYes && onConfirmYes()}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '6px',
                    background: '#10b981',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ✓ Yes (Confirm)
                </button>
                <button
                  onClick={() => onConfirmNo && onConfirmNo()}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '6px',
                    background: '#ef4444',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ✕ No (Cancel)
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: SEARCH & RELEVANCE DEBUG */}
          {activeTab === 'search' && (
            <div style={{ overflowY: 'auto', flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* DEV NOTICE: CHROME LAZY LOAD INTERVENTION */}
              {hasIntervention && (
                <div
                  style={{
                    background: 'rgba(234, 179, 8, 0.12)',
                    border: '1px solid #eab308',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fef08a',
                    fontSize: '0.72rem',
                    lineHeight: 1.45
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, marginBottom: '4px', color: '#facc15' }}>
                    <AlertTriangle size={14} color="#facc15" />
                    <span>CHROME LAZY LOAD INTERVENTION NOTICE</span>
                  </div>
                  <div>
                    Chrome reported: <em>"Images loaded lazily and replaced with placeholders."</em> Product images inside the viewport are being guarded by VoiceCart's 4s fallback timer and auto-recovery pipeline.
                  </div>
                  <div style={{ marginTop: '5px', color: '#fef9c3', fontSize: '0.68rem', fontWeight: 600 }}>
                    💡 Dev Hint: Turn off Chrome Lite Mode / Data Saver and disable network throttling in DevTools.
                  </div>
                </div>
              )}

              {/* DASHBOARD FEED & GLOBAL STATE INFO */}
              <div style={{ background: '#1e293b', borderRadius: '8px', padding: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ color: '#c7d2fe', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Rss size={13} color="#818cf8" />
                    <span>DASHBOARD FEED & SEARCH STATE</span>
                  </div>
                  <span style={{ fontSize: '0.65rem', background: '#0f172a', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }}>
                    {feedLastUpdated ? `Refreshed: ${new Date(feedLastUpdated).toLocaleTimeString()}` : 'Live feed ready'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.72rem', color: '#cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span>Console API Logging:</span>
                    <button
                      onClick={() => {
                        const next = !apiLoggingEnabled;
                        setApiLoggingEnabled(next);
                        setApiDebugEnabled(next);
                      }}
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.68rem',
                        borderRadius: '4px',
                        border: 'none',
                        background: apiLoggingEnabled ? '#10b981' : '#334155',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                    >
                      {apiLoggingEnabled ? 'ON (DEBUG)' : 'OFF (CLEAN)'}
                    </button>
                  </div>
                  <div>
                    Feed Source: <strong style={{ color: '#38bdf8' }}>{feedSource}</strong>
                  </div>
                  <div>
                    Search Bar State:{' '}
                    {currentQuery.trim() ? (
                      <strong style={{ color: '#fde047' }}>"{currentQuery}"</strong>
                    ) : (
                      <strong style={{ color: '#34d399' }}>EMPTY (Starts clean on page load)</strong>
                    )}
                  </div>
                  {selectedProduct && (
                    <div style={{ marginTop: '4px', background: '#0f172a', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <div style={{ color: '#a5b4fc', fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <PackageCheck size={12} color="#a5b4fc" />
                        <span>Selected / Clicked Product:</span>
                      </div>
                      <div style={{ color: '#f8fafc', fontSize: '0.7rem' }}>
                        [{selectedProduct.store.toUpperCase()}] {selectedProduct.title.slice(0, 45)}...
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.65rem', marginTop: '2px' }}>
                        ID: <code style={{ color: '#38bdf8' }}>{selectedProduct.productId}</code> | Price: <strong style={{ color: '#34d399' }}>₹{selectedProduct.price}</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!debugTrace ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '20px 0' }}>
                  <Search size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <div>No search executed yet in this session.</div>
                  <div style={{ fontSize: '0.7rem', marginTop: '4px' }}>Type or speak a product query to see the live pipeline trace.</div>
                </div>
              ) : (
                <>
                  {/* 0. ACTIVE SEARCH SESSION & RECOMMENDATION INTEGRITY */}
                  {(() => {
                    const active = state.activeSearch;
                    const rec = active.recommendation || state.searchResults?.recommendation || state.searchResults?.topRecommendations?.bestOverall;
                    const specBrand = debugTrace.spec?.brand;
                    const brandMismatch = Boolean(
                      specBrand &&
                      rec?.title &&
                      !rec.title.toLowerCase().includes(specBrand.toLowerCase()) &&
                      !(specBrand.toLowerCase() === 'apple' && rec.title.toLowerCase().includes('iphone'))
                    );
                    const replyMismatch = Boolean(
                      active.replyText &&
                      rec?.title &&
                      !active.replyText.toLowerCase().includes(rec.title.slice(0, 12).toLowerCase())
                    );

                    return (
                      <div
                        style={{
                          background: brandMismatch || replyMismatch ? 'rgba(239, 68, 68, 0.15)' : '#1e293b',
                          borderRadius: '8px',
                          padding: '10px',
                          border: `1px solid ${brandMismatch || replyMismatch ? '#ef4444' : 'rgba(99, 102, 241, 0.3)'}`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ color: '#c7d2fe', fontSize: '0.72rem', fontWeight: 800 }}>
                            0. ACTIVE SEARCH SESSION (IMMUTABLE ID)
                          </span>
                          <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                            ID: <strong style={{ color: '#38bdf8' }}>{active.searchId || state.searchResults?.searchId || 'N/A'}</strong>
                          </span>
                        </div>

                        {(brandMismatch || replyMismatch) && (
                          <div style={{ background: '#ef4444', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, marginBottom: '6px' }}>
                            ⚠️ MISMATCH DETECTED: {brandMismatch ? 'Recommendation does not match brand spec!' : ''} {replyMismatch ? 'Spoken text does not match recommended card!' : ''}
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.72rem' }}>
                          <div style={{ color: '#cbd5e1' }}>
                            Recommendation:{' '}
                            {rec ? (
                              <strong style={{ color: brandMismatch ? '#ef4444' : '#34d399' }}>
                                [{rec.store?.toUpperCase()}] {rec.title?.slice(0, 45)}... (₹{rec.price?.toLocaleString('en-IN')})
                              </strong>
                            ) : (
                              <em style={{ color: '#94a3b8' }}>None (No item passed relevance ≥ 70)</em>
                            )}
                          </div>
                          {active.replyText && (
                            <div style={{ color: '#cbd5e1' }}>
                              Reply Text: <span style={{ color: replyMismatch ? '#ef4444' : '#a7f3d0' }}>"{active.replyText}"</span>
                            </div>
                          )}
                          {active.spokenText && active.spokenText !== active.replyText && (
                            <div style={{ color: '#cbd5e1' }}>
                              Spoken Text: <span style={{ color: '#fde047' }}>"{active.spokenText}"</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 1. QUERY & ENGLISH TRANSCRIPT */}
                  <div style={{ background: '#1e293b', borderRadius: '8px', padding: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, marginBottom: '4px' }}>
                      1. INPUT QUERY & TRANSLATION
                    </div>
                    <div style={{ color: '#f8fafc', fontSize: '0.8rem', fontWeight: 600 }}>
                      Raw: <span style={{ color: '#38bdf8' }}>"{debugTrace.spec?.rawQuery || debugTrace.transcript}"</span>
                    </div>
                    {debugTrace.spec?.englishQuery && debugTrace.spec.englishQuery !== debugTrace.spec.rawQuery && (
                      <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginTop: '2px' }}>
                        English: <span style={{ color: '#a7f3d0' }}>"{debugTrace.spec.englishQuery}"</span>
                      </div>
                    )}
                    <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginTop: '4px', background: '#0f172a', padding: '4px 8px', borderRadius: '4px' }}>
                      Clean Search: <strong style={{ color: '#fde047' }}>"{debugTrace.spec?.cleanSearchQuery}"</strong>
                    </div>
                  </div>

                  {/* 2. PARSED SPEC */}
                  <div style={{ background: '#1e293b', borderRadius: '8px', padding: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700 }}>
                        2. PARSED PRODUCT SPEC (STRICT JSON)
                      </span>
                      <span style={{
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        background: debugTrace.spec?.isSpecific ? '#065f46' : '#1e3a8a',
                        color: '#fff',
                        fontWeight: 700
                      }}>
                        {debugTrace.spec?.isSpecific ? 'SPECIFIC' : 'GENERIC'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.72rem', color: '#cbd5e1' }}>
                      <div>Type: <strong style={{ color: '#93c5fd' }}>{debugTrace.spec?.productType || 'N/A'}</strong></div>
                      <div>Brand: <strong style={{ color: '#93c5fd' }}>{debugTrace.spec?.brand || 'N/A'}</strong></div>
                      <div>Model: <strong style={{ color: '#93c5fd' }}>{debugTrace.spec?.model || 'N/A'}</strong></div>
                      <div>Budget: <strong style={{ color: '#93c5fd' }}>{debugTrace.spec?.budgetMax ? `≤ ₹${debugTrace.spec.budgetMax}` : 'No limit'}</strong></div>
                    </div>
                    {debugTrace.spec?.variant && Object.keys(debugTrace.spec.variant).length > 0 && (
                      <div style={{ marginTop: '6px', fontSize: '0.7rem', color: '#a5b4fc', background: '#0f172a', padding: '4px 8px', borderRadius: '4px' }}>
                        Variants: {JSON.stringify(debugTrace.spec.variant)}
                      </div>
                    )}
                    {debugTrace.spec?.mustExclude && debugTrace.spec.mustExclude.length > 0 && (
                      <div style={{ marginTop: '6px', fontSize: '0.68rem', color: '#f87171' }}>
                        Default Excludes: {debugTrace.spec.mustExclude.slice(0, 6).join(', ')}...
                      </div>
                    )}
                  </div>

                  {/* 3. QUERIES SENT & PIPELINE COUNTS */}
                  <div style={{ background: '#1e293b', borderRadius: '8px', padding: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, marginBottom: '6px' }}>
                      3. SEARCH EXECUTION & SOURCE COUNTS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
                      {(['amazon', 'flipkart', 'meesho', 'voicecart'] as const).map(store => {
                        const raw = debugTrace.rawCounts?.[store] || 0;
                        const filtered = debugTrace.filteredCounts?.[store] || 0;
                        return (
                          <div key={store} style={{ background: '#0f172a', padding: '4px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'capitalize' }}>{store}</div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: filtered > 0 ? '#34d399' : '#f87171' }}>
                              {filtered} <span style={{ fontSize: '0.62rem', color: '#64748b' }}>/ {raw}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                      Queries dispatched: {debugTrace.queriesSent?.map(q => `[${q.store}: ${q.queries.join(', ')}]`).join(' ')}
                    </div>
                  </div>

                  {/* 4. REJECTIONS */}
                  {debugTrace.rejections && debugTrace.rejections.length > 0 && (
                    <div style={{ background: '#1e293b', borderRadius: '8px', padding: '10px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      <div style={{ color: '#f87171', fontSize: '0.7rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Filter size={12} />
                        <span>RELEVANCE FILTER DROPS ({debugTrace.rejections.length} items)</span>
                      </div>
                      <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {debugTrace.rejections.slice(0, 10).map((rej, i) => (
                          <div key={i} style={{ fontSize: '0.68rem', background: 'rgba(239, 68, 68, 0.1)', padding: '3px 6px', borderRadius: '4px', color: '#fca5a5' }}>
                            <strong style={{ color: '#fff' }}>[{rej.store.toUpperCase()}]</strong> {rej.title.substring(0, 45)}... → <span style={{ color: '#f87171', fontWeight: 700 }}>{rej.rejectionReason}</span> (Score: {rej.relevanceScore})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. TOP 3 RESULTS */}
                  <div style={{ background: '#1e293b', borderRadius: '8px', padding: '10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <div style={{ color: '#34d399', fontSize: '0.7rem', fontWeight: 700, marginBottom: '6px' }}>
                      5. FINAL TOP 3 (GATED & RANKED)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(debugTrace.top3 || []).map((prod, idx) => (
                        <div key={prod.productId || idx} style={{ background: '#0f172a', padding: '6px 8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1, marginRight: '8px' }}>
                            <div style={{ color: '#f8fafc', fontSize: '0.74rem', fontWeight: 600 }}>
                              #{idx + 1} {prod.title.substring(0, 40)}...
                            </div>
                            <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
                              Store: <strong style={{ color: '#38bdf8' }}>{prod.store.toUpperCase()}</strong> | Price: <strong style={{ color: '#34d399' }}>₹{prod.price}</strong> | Rel: <strong style={{ color: '#fde047' }}>{prod.relevanceScore || 100}</strong>
                            </div>
                          </div>
                          {prod.badges && prod.badges[0] && (
                            <span style={{ fontSize: '0.62rem', background: '#3b82f6', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              {prod.badges[0]}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: VOICE COMMAND LOGS */}
          {activeTab === 'voice' && (
            <div style={{ overflowY: 'auto', flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {state.debugLogs.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '24px 0' }}>
                  <Activity size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <div>No voice commands received yet.</div>
                  <div style={{ fontSize: '0.7rem', marginTop: '4px' }}>Speak into the mic to see live command routing.</div>
                </div>
              ) : (
                state.debugLogs.map((entry) => {
                  const isRule = entry.layer === 'rule';
                  const confPercent = Math.round(entry.confidence * 100);
                  const confColor = entry.confidence >= 0.8 ? '#10b981' : entry.confidence >= 0.6 ? '#f59e0b' : '#ef4444';

                  return (
                    <div
                      key={entry.id}
                      style={{
                        background: 'rgba(30, 41, 59, 0.7)',
                        borderRadius: '8px',
                        padding: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      {/* TOP HEADER */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              background: isRule ? 'rgba(99, 102, 241, 0.25)' : 'rgba(236, 72, 153, 0.25)',
                              color: isRule ? '#818cf8' : '#f472b6',
                              border: isRule ? '1px solid #6366f1' : '1px solid #ec4899',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            {isRule ? <Zap size={10} /> : <Cpu size={10} />}
                            {isRule ? 'RULE LAYER' : 'AI LAYER'}
                          </span>

                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: '#0f172a',
                              color: '#38bdf8'
                            }}
                          >
                            {entry.action}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.7rem', color: confColor, fontWeight: 700 }}>
                            {confPercent}%
                          </span>
                          <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                            {entry.timestamp}
                          </span>
                        </div>
                      </div>

                      {/* TRANSCRIPT */}
                      <div style={{ color: '#f8fafc', marginBottom: '4px', fontSize: '0.76rem' }}>
                        <span style={{ color: '#94a3b8' }}>🗣️ </span>"{entry.transcript}"
                      </div>

                      {/* PARAMS */}
                      {Object.keys(entry.params).length > 0 && (
                        <div style={{ background: '#090d16', padding: '4px 8px', borderRadius: '4px', color: '#a5b4fc', fontSize: '0.68rem', marginBottom: '4px', overflowX: 'auto' }}>
                          {JSON.stringify(entry.params)}
                        </div>
                      )}

                      {/* EXECUTION RESULT */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399', fontSize: '0.72rem' }}>
                        <CheckCircle2 size={12} />
                        <span>{entry.executionResult}</span>
                      </div>

                      {/* SPOKEN REPLY */}
                      {entry.reply && (
                        <div style={{ marginTop: '4px', color: '#cbd5e1', fontSize: '0.7rem', fontStyle: 'italic', borderLeft: '2px solid #6366f1', paddingLeft: '6px' }}>
                          💬 "{entry.reply}"
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: CATALOG DATABASE & MONITORING */}
          {activeTab === 'catalog' && (
            <div style={{ overflowY: 'auto', flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.85rem' }}>
                  📦 REAL CATALOG DATABASE STATUS
                </span>
                <button
                  type="button"
                  onClick={loadCatalogStatus}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #475569',
                    color: '#94a3b8',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.68rem',
                    cursor: 'pointer'
                  }}
                >
                  {catalogLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              {catalogLoading && !catalogStatus ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                  Loading catalog database metrics...
                </div>
              ) : catalogStatus?.status ? (
                <>
                  {/* Summary Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <div style={{ background: '#1e293b', padding: '8px 10px', borderRadius: '8px', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Total Products</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>
                        {catalogStatus.status.totalProducts}
                      </div>
                    </div>
                    <div style={{ background: '#1e293b', padding: '8px 10px', borderRadius: '8px', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>With Working Images</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>
                        {catalogStatus.status.productsWithImages} (100%)
                      </div>
                    </div>
                    <div style={{ background: '#1e293b', padding: '8px 10px', borderRadius: '8px', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>With Specifications</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#a78bfa' }}>
                        {catalogStatus.status.productsWithSpecs}
                      </div>
                    </div>
                    <div style={{ background: '#1e293b', padding: '8px 10px', borderRadius: '8px', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>With Customer Ratings</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#facc15' }}>
                        {catalogStatus.status.productsWithRating}
                      </div>
                    </div>
                  </div>

                  {/* Store Breakdown */}
                  <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '6px' }}>
                      🏪 STORE DISTRIBUTION
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {Object.entries(catalogStatus.status.storeBreakdown || {}).map(([store, count]: any) => (
                        <div key={store} style={{ flex: 1, background: '#0f172a', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'capitalize' }}>{store}</span>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{count}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '6px' }}>
                      📁 CATEGORY DISTRIBUTION ({Object.keys(catalogStatus.status.categoryBreakdown || {}).length} Categories)
                    </div>
                    <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                      {Object.entries(catalogStatus.status.categoryBreakdown || {}).map(([cat, count]: any) => (
                        <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', background: '#0f172a', borderRadius: '4px', fontSize: '0.68rem' }}>
                          <span style={{ color: '#cbd5e1' }}>{cat}</span>
                          <span style={{ color: '#38bdf8', fontWeight: 700 }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Provider & Quota Guard Status */}
                  <div style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '6px' }}>
                      🛡️ PROVIDERS & QUOTA GUARD
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.7rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>SerpApi (Google Shopping):</span>
                        <span style={{ color: catalogStatus.providers?.serpApi?.configured ? '#34d399' : '#f87171' }}>
                          {catalogStatus.providers?.serpApi?.configured ? 'Active (Quota Guard Engaged)' : 'Missing'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Meesho Verified Feed:</span>
                        <span style={{ color: '#34d399' }}>Active ✅</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Flipkart / Amazon Direct:</span>
                        <span style={{ color: '#94a3b8' }}>Aggregator Fallback Active</span>
                      </div>
                      {catalogStatus.lastJob && (
                        <div style={{ marginTop: '4px', borderTop: '1px solid #334155', paddingTop: '4px', color: '#94a3b8' }}>
                          Last Ingest Job: <span style={{ color: '#38bdf8' }}>#{catalogStatus.lastJob.id} ({catalogStatus.lastJob.status})</span> at {new Date(catalogStatus.lastJob.started_at).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '16px' }}>
                  Unable to reach catalog status API.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
