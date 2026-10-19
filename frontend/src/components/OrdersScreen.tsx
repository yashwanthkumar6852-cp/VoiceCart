import React, { useState } from 'react';
import { Package, ExternalLink, Plus, CheckCircle2, Clock } from 'lucide-react';
import { OrderRecord } from '../types';
import { api } from '../services/api';

interface Props {
  orders: OrderRecord[];
  onOrderAdded: (order: OrderRecord) => void;
}

export const OrdersScreen: React.FC<Props> = ({ orders, onOrderAdded }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [smsText, setSmsText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [manualStore, setManualStore] = useState<'amazon' | 'flipkart' | 'meesho'>('amazon');
  const [manualOrderId, setManualOrderId] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualAmount, setManualAmount] = useState('');

  const handleParseSms = async () => {
    if (!smsText.trim()) return;
    setIsParsing(true);
    setErrorMsg(null);
    try {
      const res = await api.parseOrderSMS(smsText);
      if (res.order) {
        onOrderAdded(res.order);
        setShowAddModal(false);
        setSmsText('');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Could not parse order ID from message text.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleManualAdd = async () => {
    if (!manualOrderId.trim()) {
      setErrorMsg('Order ID is required.');
      return;
    }
    try {
      const res = await api.addOrder({
        store: manualStore,
        orderId: manualOrderId.trim(),
        productTitle: manualTitle.trim() || `${manualStore.toUpperCase()} Order (#${manualOrderId})`,
        totalAmount: manualAmount ? parseFloat(manualAmount) : 1499
      });
      if (res.order) {
        onOrderAdded(res.order);
        setShowAddModal(false);
        setManualOrderId('');
        setManualTitle('');
        setManualAmount('');
      }
    } catch (err: any) {
      setErrorMsg('Failed to save order.');
    }
  };

  return (
    <div>
      {/* Header & Add Order Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <Package size={22} color="var(--primary)" />
            <span>Tracked Orders ({orders.length})</span>
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '2px' }}>
            Live tracking across Amazon India, Flipkart, and Meesho
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            border: 'none',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 15px var(--primary-glow)'
          }}
        >
          <Plus size={16} /> Track New Order
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="glass-panel" style={{ padding: '50px 20px', textAlign: 'center' }}>
          <Package size={48} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>No Orders Tracked Yet</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto 16px' }}>
            After making a purchase on Amazon or Flipkart, paste the confirmation SMS or order ID here to track it.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid var(--primary)',
              color: 'var(--primary)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Paste Order SMS / Confirmation
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map((order) => (
            <div key={order.id} className="glass-panel" style={{ padding: '20px' }}>
              {/* Top Row: Store, ID, Date, Amount */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background:
                        order.store === 'amazon'
                          ? '#ff9900'
                          : order.store === 'flipkart'
                          ? '#2874f0'
                          : order.store === 'meesho'
                          ? '#f43397'
                          : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: order.store === 'amazon' ? '#000' : '#fff'
                    }}
                  >
                    {order.store === 'voicecart' ? 'VOICECART DIRECT' : order.store.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Order #{order.orderId}
                  </span>
                  {order.status === 'PENDING_VERIFICATION' ? (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(234, 179, 8, 0.15)',
                        color: 'var(--accent-gold)',
                        fontWeight: 700,
                        border: '1px solid rgba(234, 179, 8, 0.4)'
                      }}
                    >
                      ⏳ PENDING VERIFICATION {order.utrNumber ? `(UTR: ${order.utrNumber})` : ''}
                    </span>
                  ) : order.paymentId ? (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: 'var(--accent-green)',
                        fontWeight: 700,
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      PAID ({order.paymentMethod || 'UPI / Gateway'})
                    </span>
                  ) : null}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                    ₹{order.totalAmount.toLocaleString()}
                  </span>
                  {order.store === 'voicecart' ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(99, 102, 241, 0.15)',
                          border: '1px solid var(--primary)',
                          color: 'var(--primary)',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      >
                        Express Fulfillment
                      </span>
                    </div>
                  ) : (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid var(--primary)',
                        color: 'var(--primary)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      Official Store Tracking <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>

              {/* Title & Payment Details */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                  {order.productTitle}
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>
                    Ordered on {new Date(order.orderedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {order.paymentMethod && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Mode: <strong>{order.paymentMethod}</strong>
                    </span>
                  )}
                  {order.paymentId && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Payment Ref: <code style={{ color: 'var(--primary)' }}>{order.paymentId}</code>
                    </span>
                  )}
                  {order.estimatedDeliveryDate && (
                    <span style={{ color: 'var(--accent-green)' }}>
                      Est. Delivery: {order.estimatedDeliveryDate}
                    </span>
                  )}
                </div>
              </div>

              {/* Timeline Progress */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '14px' }}>
                {order.timeline.map((step, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      background: step.completed ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-subtle)',
                      border: step.completed ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {step.completed ? (
                        <CheckCircle2 size={16} color="var(--accent-green)" />
                      ) : (
                        <Clock size={16} color="var(--text-dim)" />
                      )}
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: step.completed ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                        {step.stage}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{step.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Order Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="glass-panel"
            style={{ width: '100%', maxWidth: '500px', padding: '24px', background: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-main)' }}>
              Track Amazon / Flipkart / Meesho Order
            </h3>

            {errorMsg && (
              <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)', fontSize: '0.82rem', marginBottom: '12px' }}>
                {errorMsg}
              </div>
            )}

            {/* Tab 1: Smart SMS parser */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                Option A: Paste Order Confirmation SMS or Email
              </label>
              <textarea
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                placeholder="Paste message e.g.: 'Amazon.in: Your order 402-1234567-8901234 has been dispatched...'"
                rows={3}
                className="glass-input"
                style={{ width: '100%', resize: 'none', marginBottom: '8px' }}
              />
              <button
                onClick={handleParseSms}
                disabled={isParsing || !smsText.trim()}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {isParsing ? 'Parsing Message...' : '⚡ Smart Extract & Track'}
              </button>
            </div>

            <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem', margin: '14px 0' }}>— OR ENTER MANUALLY —</div>

            {/* Tab 2: Manual Entry */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <select
                  value={manualStore}
                  onChange={(e: any) => setManualStore(e.target.value)}
                  className="glass-input"
                  style={{ color: 'var(--text-main)', background: 'var(--bg-input)' }}
                >
                  <option value="amazon">Amazon</option>
                  <option value="flipkart">Flipkart</option>
                  <option value="meesho">Meesho</option>
                </select>
                <input
                  type="text"
                  value={manualOrderId}
                  onChange={(e) => setManualOrderId(e.target.value)}
                  placeholder="Order ID (e.g. 402-1234567-8901234)"
                  className="glass-input"
                />
              </div>

              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Product Name / Description"
                className="glass-input"
              />

              <input
                type="number"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                placeholder="Total Amount (₹)"
                className="glass-input"
              />

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualAdd}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--accent-green)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Add Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
