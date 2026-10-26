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

  const availablePrices = comparisonMatrix
    .filter((item) => item.available && item.lowestPrice && item.lowestPrice > 0)
    .map((item) => item.lowestPrice as number);
  const minPrice = availablePrices.length > 0 ? Math.min(...availablePrices) : null;

  const fastestDeliveries = comparisonMatrix
    .filter((item) => item.available && item.fastestDeliveryDays && item.fastestDeliveryDays > 0)
    .map((item) => item.fastestDeliveryDays as number);
  const minDeliveryDays = fastestDeliveries.length > 0 ? Math.min(...fastestDeliveries) : null;

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
              const isLowest = isAvailable && minPrice !== null && item.lowestPrice === minPrice;
              const isFastest = isAvailable && minDeliveryDays !== null && item.fastestDeliveryDays === minDeliveryDays;

              return (
                <tr
                  key={item.store}
                  className={isLowest ? 'comparison-winner-row' : ''}
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
                    {isAvailable ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>₹{item.lowestPrice?.toLocaleString('en-IN')}</span>
                        {isLowest && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: '#ffffff',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              boxShadow: '0 2px 5px rgba(16, 185, 129, 0.35)'
                            }}
                          >
                            Lowest
                          </span>
                        )}
                      </div>
                    ) : (
                      '—'
                    )}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} color="var(--secondary)" />
                          {item.fastestDeliveryDays === 1 ? '1 Day' : `${item.fastestDeliveryDays} Days`}
                        </span>
                        {isFastest && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              background: 'rgba(6, 182, 212, 0.15)',
                              color: 'var(--secondary)',
                              border: '1px solid var(--secondary)',
                              padding: '1px 5px',
                              borderRadius: '4px'
                            }}
                          >
                            Fastest
                          </span>
                        )}
                      </div>
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
