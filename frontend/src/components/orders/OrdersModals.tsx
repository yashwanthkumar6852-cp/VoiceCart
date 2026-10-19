import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Package,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  Send,
  Plus
} from 'lucide-react';
import { OrderRecord, StoreName } from '../../types';
import { api } from '../../services/api';

// ----------------------------------------------------
// 1. CANCEL ORDER MODAL
// ----------------------------------------------------
interface CancelOrderModalProps {
  order: OrderRecord;
  isOpen: boolean;
  onClose: () => void;
  onCancelled: (updatedOrder: OrderRecord) => void;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onCancelled
}) => {
  const [selectedReason, setSelectedReason] = useState('Found a better price elsewhere');
  const [customNotes, setCustomNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const REASONS = [
    'Found a better price elsewhere',
    'Ordered by mistake / duplicate order',
    'Delivery time is too long',
    'Need to change delivery address or contact details',
    'Item no longer required',
    'Other reason'
  ];

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const finalReason = selectedReason === 'Other reason' && customNotes.trim()
      ? customNotes.trim()
      : selectedReason;

    try {
      const res = await api.cancelOrder(order.orderId, finalReason);
      if (res.success && res.order) {
        onCancelled(res.order);
        onClose();
      } else {
        setErrorMessage(res.message || 'Failed to cancel order.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || err.message || 'Order could not be cancelled.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 45px rgba(0,0,0,0.4)',
          border: '1px solid var(--border-color)',
          animation: 'fadeIn 0.2s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-rose)' }}>
            <AlertTriangle size={20} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Cancel Order #{order.orderId}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.4 }}>
          Are you sure you want to cancel this order? Since this order has not been dispatched yet, a 100% demo refund of <strong>₹{order.totalAmount.toLocaleString()}</strong> will be initiated back to your payment source.
        </p>

        {errorMessage && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#ef4444',
              fontSize: '0.8rem',
              marginBottom: '14px'
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleCancelSubmit}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
            Please select a reason for cancellation:
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
            {REASONS.map((r) => (
              <label
                key={r}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: selectedReason === r ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-subtle)',
                  border: selectedReason === r ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  color: 'var(--text-main)'
                }}
              >
                <input
                  type="radio"
                  name="cancelReason"
                  value={r}
                  checked={selectedReason === r}
                  onChange={() => setSelectedReason(r)}
                />
                <span>{r}</span>
              </label>
            ))}
          </div>

          {selectedReason === 'Other reason' && (
            <textarea
              rows={2}
              placeholder="Tell us more about why you are cancelling..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="glass-input"
              style={{ width: '100%', marginBottom: '14px', resize: 'none' }}
              required
            />
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Keep Order
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 1.3,
                padding: '10px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: 'none',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={15} className="mic-active-pulse" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <span>Confirm Cancellation</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 2. ADD EXTERNAL ORDER MODAL
// ----------------------------------------------------
interface AddExternalOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderAdded: (newOrder: OrderRecord) => void;
}

export const AddExternalOrderModal: React.FC<AddExternalOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderAdded
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'manual'>('paste');
  const [smsText, setSmsText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manual fields
  const [manualStore, setManualStore] = useState<StoreName>('amazon');
  const [manualOrderId, setManualOrderId] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualAmount, setManualAmount] = useState('');

  if (!isOpen) return null;

  const handleParseSms = async () => {
    if (!smsText.trim()) return;
    setIsParsing(true);
    setErrorMessage(null);
    try {
      const res = await api.parseOrderSMS(smsText);
      if (res.order) {
        onOrderAdded(res.order);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error ||
        'Could not extract an Amazon, Flipkart, or Meesho Order ID from the text provided.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualOrderId.trim()) {
      setErrorMessage('Order ID is required.');
      return;
    }
    setIsParsing(true);
    setErrorMessage(null);
    try {
      const res = await api.addExternalOrder({
        store: manualStore,
        orderId: manualOrderId.trim(),
        productTitle: manualTitle.trim() || `${manualStore.toUpperCase()} Order (${manualOrderId.trim()})`,
        totalAmount: manualAmount ? parseFloat(manualAmount) : 1499
      });
      if (res.order) {
        onOrderAdded(res.order);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to save order.');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 45px rgba(0,0,0,0.4)',
          border: '1px solid var(--border-color)',
          animation: 'fadeIn 0.2s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={20} color="var(--primary)" />
              <span>Add Order from Amazon, Flipkart or Meesho</span>
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Keep all your online purchases organized and tracked in VoiceCart
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('paste')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              background: activeTab === 'paste' ? 'var(--primary)' : 'var(--bg-subtle)',
              border: 'none',
              color: activeTab === 'paste' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ⚡ Paste SMS / Confirmation Email
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              background: activeTab === 'manual' ? 'var(--primary)' : 'var(--bg-subtle)',
              border: 'none',
              color: activeTab === 'manual' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ✏️ Manual Entry
          </button>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#ef4444',
              fontSize: '0.8rem',
              marginBottom: '14px'
            }}
          >
            {errorMessage}
          </div>
        )}

        {activeTab === 'paste' ? (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Paste order confirmation text from SMS, WhatsApp, or Email:
            </label>
            <textarea
              rows={4}
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              placeholder="e.g. 'Amazon: Your order 402-1234567-8901234 for boAt Airdopes of Rs. 1,299 has been dispatched...'"
              className="glass-input"
              style={{ width: '100%', resize: 'none', marginBottom: '14px', fontSize: '0.85rem' }}
            />

            <button
              onClick={handleParseSms}
              disabled={isParsing || !smsText.trim()}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: isParsing || !smsText.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isParsing ? <RefreshCw size={16} className="mic-active-pulse" /> : <Plus size={16} />}
              <span>{isParsing ? 'Extracting & Adding Order...' : 'Extract & Track Order'}</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleManualAdd} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Store
                </label>
                <select
                  value={manualStore}
                  onChange={(e: any) => setManualStore(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', padding: '10px' }}
                >
                  <option value="amazon">Amazon India</option>
                  <option value="flipkart">Flipkart</option>
                  <option value="meesho">Meesho</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Order ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 402-9876543-1234567"
                  value={manualOrderId}
                  onChange={(e) => setManualOrderId(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', padding: '10px' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Product Name / Title
              </label>
              <input
                type="text"
                placeholder="e.g. Apple iPhone 15 128GB Black"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="glass-input"
                style={{ width: '100%', padding: '10px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Total Paid (₹)
              </label>
              <input
                type="number"
                placeholder="1499"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                className="glass-input"
                style={{ width: '100%', padding: '10px' }}
              />
            </div>

            <button
              type="submit"
              disabled={isParsing}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: isParsing ? 'not-allowed' : 'pointer',
                marginTop: '4px'
              }}
            >
              {isParsing ? 'Saving Order...' : 'Save & Track on VoiceCart'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 3. ORDER SUPPORT / NEED HELP MODAL
// ----------------------------------------------------
interface OrderSupportModalProps {
  order: OrderRecord;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderSupportModal: React.FC<OrderSupportModalProps> = ({
  order,
  isOpen,
  onClose
}) => {
  const [topic, setTopic] = useState('Delivery Delay / Tracking Issue');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '500px',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 45px rgba(0,0,0,0.4)',
          border: '1px solid var(--border-color)',
          animation: 'fadeIn 0.2s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
            <HelpCircle size={22} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              VoiceCart Support Desk
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
              Support Ticket Created
            </h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Ticket Reference: <strong>#TKT-{Date.now().toString().slice(-6)}</strong> for Order #{order.orderId}.
              Our support specialist will follow up with you on WhatsApp/SMS within 2 hours.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                background: 'var(--primary)',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Back to Order Details
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-subtle)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Order ID: <strong style={{ color: 'var(--text-main)' }}>{order.orderId}</strong> • Amount: <strong>₹{order.totalAmount.toLocaleString()}</strong>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Inquiry Topic
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="glass-input"
                style={{ width: '100%', padding: '10px' }}
              >
                <option value="Delivery Delay / Tracking Issue">Delivery Delay / Tracking Issue</option>
                <option value="Return / Replacement Request">Return / Replacement Request</option>
                <option value="Payment or Invoice Query">Payment or Invoice Query</option>
                <option value="Damaged or Wrong Item Received">Damaged or Wrong Item Received</option>
                <option value="Other Order Inquiry">Other Order Inquiry</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                How can we help? (Optional details)
              </label>
              <textarea
                rows={3}
                placeholder="Describe your question or issue in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="glass-input"
                style={{ width: '100%', resize: 'none', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                style={{
                  flex: 1.5,
                  padding: '10px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Send size={15} />
                <span>Submit Ticket</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
