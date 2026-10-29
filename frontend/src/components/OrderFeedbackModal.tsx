import React, { useState, useEffect } from 'react';
import { Star, X, Check, MessageSquare, Sparkles, ThumbsUp, Send, Loader2, PackageCheck } from 'lucide-react';
import { OrderRecord, OrderCustomerFeedback } from '../types';
import { api } from '../lib/api';

interface OrderFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderRecord | null;
  onFeedbackSubmitted: (updatedOrder: OrderRecord) => void;
}

const RATING_LABELS: Record<number, { text: string; emoji: string; color: string }> = {
  1: { text: 'Needs Improvement', emoji: '😞', color: '#ef4444' },
  2: { text: 'Fair Experience', emoji: '😐', color: '#f97316' },
  3: { text: 'Good & Satisfactory', emoji: '🙂', color: '#eab308' },
  4: { text: 'Very Good, Liked It!', emoji: '😊', color: '#10b981' },
  5: { text: 'Outstanding / Loved It!', emoji: '🤩', color: '#6366f1' }
};

const POPULAR_TAGS = [
  '⚡ Lightning Fast Delivery',
  '📦 Safe & Secure Packaging',
  '🛡️ 100% Genuine Product',
  '💰 Best Price vs Other Stores',
  '🤝 Polite Delivery Executive',
  '🎧 Matches Voice Search Exactly'
];

export const OrderFeedbackModal: React.FC<OrderFeedbackModalProps> = ({
  isOpen,
  onClose,
  order,
  onFeedbackSubmitted
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (order && order.customerFeedback) {
      setRating(order.customerFeedback.rating || 5);
      setComment(order.customerFeedback.comment || '');
      setSelectedTags(order.customerFeedback.tags || []);
    } else {
      setRating(5);
      setComment('');
      setSelectedTags(['⚡ Lightning Fast Delivery', '📦 Safe & Secure Packaging']);
    }
    setErrorMsg('');
    setSuccessMsg('');
    setHoverRating(null);
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const currentDisplayRating = hoverRating !== null ? hoverRating : rating;
  const ratingInfo = RATING_LABELS[currentDisplayRating] || RATING_LABELS[5];

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setErrorMsg('Please select a rating between 1 and 5 stars.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.submitOrderFeedback(order.orderId, {
        rating,
        comment: comment.trim(),
        tags: selectedTags
      });

      setSuccessMsg('🎉 Thank you! Your 5-star delivery review has been saved.');
      setTimeout(() => {
        onFeedbackSubmitted(res.order);
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = Boolean(order.customerFeedback);

  return (
    <div
      className="order-feedback-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 10001,
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
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '20px',
          padding: '28px',
          position: 'relative',
          background: 'var(--card-bg, #1e293b)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Close"
        >
          <X size={18} />
        </button>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}
          >
            <Sparkles size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              {isEditing ? 'Update Your Delivery Feedback' : 'Rate Your Delivery Experience'}
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Share your 5-star rating for Order #{order.orderId}
            </span>
          </div>
        </div>

        {/* PRODUCT MINI CARD */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '12px 14px',
            background: 'var(--bg-subtle, rgba(255, 255, 255, 0.04))',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            marginBottom: '22px'
          }}
        >
          {order.productImage ? (
            <img
              src={order.productImage}
              alt={order.productTitle}
              style={{
                width: '48px',
                height: '48px',
                objectFit: 'contain',
                borderRadius: '8px',
                background: '#fff',
                padding: '4px'
              }}
            />
          ) : (
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)'
              }}
            >
              <PackageCheck size={24} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h5
              style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                margin: '0 0 4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {order.productTitle}
            </h5>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--accent-green)' }}>
              <PackageCheck size={13} />
              <span>Delivered • ₹{order.totalAmount.toLocaleString()} via {order.paymentMethod || 'VoiceCart'}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* STAR RATING INTERACTIVE WIDGET */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '18px 12px',
              background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.02) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '14px',
              gap: '10px'
            }}
          >
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              How satisfied are you with this delivery?
            </span>

            {/* 5 STARS ROW */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '6px 0' }}>
              {[1, 2, 3, 4, 5].map((starVal) => {
                const isFilled = starVal <= currentDisplayRating;
                return (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setRating(starVal)}
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '8px',
                      transform: currentDisplayRating === starVal || hoverRating === starVal ? 'scale(1.25)' : 'scale(1)',
                      transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                    title={`${starVal} Star${starVal > 1 ? 's' : ''}`}
                  >
                    <Star
                      size={36}
                      fill={isFilled ? '#f59e0b' : 'none'}
                      color={isFilled ? '#f59e0b' : 'rgba(148, 163, 184, 0.5)'}
                      strokeWidth={2}
                      style={{
                        filter: isFilled ? 'drop-shadow(0 2px 8px rgba(245, 158, 11, 0.45))' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* RATING LABEL */}
            <div
              style={{
                fontSize: '0.94rem',
                fontWeight: 800,
                color: ratingInfo.color,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{ratingInfo.emoji}</span>
              <span>{currentDisplayRating} / 5 Stars — {ratingInfo.text}</span>
            </div>
          </div>

          {/* QUICK COMPLIMENT TAGS */}
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              What went great? (Select all that apply)
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {POPULAR_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: isSelected ? '1px solid #10b981' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.18)' : 'var(--bg-subtle, rgba(255, 255, 255, 0.05))',
                      color: isSelected ? '#10b981' : 'var(--text-main)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isSelected && <Check size={12} color="#10b981" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DETAILED FEEDBACK TEXTAREA */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label
                htmlFor="order-review-comment"
                style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <MessageSquare size={14} />
                <span>Customer Review Comments:</span>
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {comment.length} / 500
              </span>
            </div>
            <textarea
              id="order-review-comment"
              rows={3}
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell other VoiceCart shoppers about your delivery speed, product condition, and unboxing experience..."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--bg-subtle, rgba(255, 255, 255, 0.04))',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '0.86rem',
                lineHeight: 1.5,
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* ERROR / SUCCESS ALERTS */}
          {errorMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                fontSize: '0.82rem',
                fontWeight: 600
              }}
            >
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                color: '#10b981',
                fontSize: '0.82rem',
                fontWeight: 700,
                textAlign: 'center'
              }}
            >
              {successMsg}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                background: 'var(--bg-subtle, rgba(255, 255, 255, 0.08))',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="mic-active-pulse" />
                  <span>Saving Review...</span>
                </>
              ) : (
                <>
                  <ThumbsUp size={16} />
                  <span>{isEditing ? 'Update 5★ Feedback' : 'Submit 5★ Feedback'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
