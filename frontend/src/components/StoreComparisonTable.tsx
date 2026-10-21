import React from 'react';
import { StoreComparisonSummary, StoreStatus } from '../types';
import { ExternalLink, CheckCircle2, AlertCircle, Clock, Star } from 'lucide-react';
import { SupportedLanguage, translations } from '../i18n/translations';

interface Props {
  comparisonMatrix: StoreComparisonSummary[];
  storeStatuses: StoreStatus[];
  language?: SupportedLanguage;
}

export const StoreComparisonTable: React.FC<Props> = ({ comparisonMatrix, storeStatuses, language = 'en' }) => {
  const t = translations[language === 'hi' || language === 'kn' ? language : 'en'] || translations.en;

  return (
    <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{t.crossStoreComparison}</span>
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.realTimeData}</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '10px 12px' }}>{t.storePlatform}</th>
              <th style={{ padding: '10px 12px' }}>{t.viewProduct}</th>
              <th style={{ padding: '10px 12px' }}>{t.dealPrice}</th>
              <th style={{ padding: '10px 12px' }}>{t.customerRating}</th>
              <th style={{ padding: '10px 12px' }}>{t.deliverySpeed}</th>
              <th style={{ padding: '10px 12px' }}>{t.platformStatus}</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>{t.buyOn}</th>
            </tr>
          </thead>
          <tbody>
            {comparisonMatrix.map((item) => {
              const status = storeStatuses.find((s) => s.store === item.store);
              const isAvailable = item.available && item.lowestPrice;

              return (
                <tr
                  key={item.store}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    fontSize: '0.88rem',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor:
                            item.store === 'amazon'
                              ? '#ff9900'
                              : item.store === 'flipkart'
                              ? '#2874f0'
                              : '#f43397'
                        }}
                      />
                      {item.storeDisplayName}
                    </div>
                  </td>

                  <td style={{ padding: '12px', maxWidth: '240px' }}>
                    {item.topProductTitle ? (
                      <span
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          color: 'var(--text-main)',
                          fontSize: '0.82rem',
                          fontWeight: 500
                        }}
                        title={item.topProductTitle}
                      >
                        {item.topProductTitle}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.8rem' }}>
                        {item.notice || `${t.notAvailable} on ${item.storeDisplayName}`}
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '12px', fontWeight: 700, color: isAvailable ? 'var(--accent-green)' : 'var(--text-dim)' }}>
                    {isAvailable ? `₹${item.lowestPrice?.toLocaleString('en-IN')}` : '—'}
                  </td>

                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                    {isAvailable && item.avgRating ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={14} fill="var(--accent-gold)" color="var(--accent-gold)" />
                        {item.avgRating} / 5.0
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>—</span>
                    )}
                  </td>

                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                    {isAvailable ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} color="var(--secondary)" />
                        {item.fastestDeliveryDays === 1 ? '1 Day' : `${item.fastestDeliveryDays} Days`}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>

                  <td style={{ padding: '12px' }}>
                    {isAvailable ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: item.isExactMatch ? 'var(--accent-green)' : 'var(--accent-gold, #f59e0b)',
                          fontSize: '0.75rem',
                          background: item.isExactMatch ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontWeight: 600
                        }}
                      >
                        <CheckCircle2 size={13} /> {item.isExactMatch ? t.exactMatch : t.similarMatches}
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--accent-rose, #f43f5e)',
                          fontSize: '0.75rem',
                          background: 'rgba(244, 63, 94, 0.1)',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontWeight: 600
                        }}
                        title={item.notice || status?.message}
                      >
                        <AlertCircle size={13} /> {item.notice || t.notAvailable}
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {item.affiliateUrl ? (
                      <a
                        href={item.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--primary)',
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      >
                        {t.buyOn} <ExternalLink size={13} />
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>{t.notAvailable}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
