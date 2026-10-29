import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  HelpCircle,
  XCircle,
  ExternalLink,
  ShoppingBag,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  MapPin,
  TrendingDown,
  Sparkles,
  Info,
  Calendar,
  Activity,
  Phone,
  Mail,
  RefreshCw,
  Zap,
  Star,
  Edit3,
  MessageSquare
} from 'lucide-react';
import { OrderRecord, OrderStatus, OrderItem, StoreName } from '../types';
import { api } from '../services/api';
import { generateAndPrintReceipt } from '../utils/receiptGenerator';
import { CancelOrderModal, OrderSupportModal } from '../components/orders/OrdersModals';
import { PaymentModal } from '../components/PaymentModal';
import { OrderFeedbackModal } from '../components/OrderFeedbackModal';
import { SupportedLanguage } from '../i18n/translations';
import { ProductImage } from '../components/ProductImage';

interface Props {
  orderId: string;
  onNavigateRoute: (route: string) => void;
  onAddToCart?: (product: any, quantity?: number) => void;
  language?: SupportedLanguage;
  showToast?: (msg: string) => void;
}

export const OrderDetailPage: React.FC<Props> = ({
  orderId,
  onNavigateRoute,
  onAddToCart,
  showToast
}) => {
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [reorderingItemId, setReorderingItemId] = useState<string | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setIsNotFound(false);
    setErrorMessage(null);

    api.getOrderById(orderId)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setOrder(data);
        } else {
          setIsNotFound(true);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err.response?.status === 404) {
          setIsNotFound(true);
        } else {
          setErrorMessage(err.response?.data?.error || 'Failed to load order details.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const handleCopyId = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.orderId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleScrollToTimeline = () => {
    if (timelineRef.current) {
      timelineRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDownloadInvoice = () => {
    if (!order) return;
    generateAndPrintReceipt(
      order,
      order.paymentDetails?.paymentId || order.paymentId,
      order.paymentDetails?.method || order.paymentMethod || 'Instant Payment',
      order.totalAmount,
      order.paidAt || order.orderedAt
    );
  };

  const handleBuyAgain = async (item: OrderItem) => {
    setReorderingItemId(item.id);
    try {
      if (onAddToCart) {
        onAddToCart(
          {
            store: item.store || order?.store || 'amazon',
            productId: item.productId,
            title: item.title,
            imageUrl: item.imageUrl,
            price: item.price,
            mrp: item.mrp,
            discountPct: item.discountPct,
            rating: 4.3,
            ratingCount: 1500,
            deliveryDays: 2,
            shippingFee: 0,
            seller: item.seller || 'Verified Merchant',
            inStock: true,
            productUrl: item.productUrl || '#',
            affiliateUrl: item.affiliateUrl || '#'
          },
          item.quantity || 1
        );
      } else {
        await api.addToCart(
          {
            store: item.store || order?.store || 'amazon',
            productId: item.productId,
            title: item.title,
            imageUrl: item.imageUrl,
            price: item.price,
            mrp: item.mrp,
            discountPct: item.discountPct,
            rating: 4.3,
            ratingCount: 1500,
            deliveryDays: 2,
            shippingFee: 0,
            seller: item.seller || 'Verified Merchant',
            inStock: true,
            productUrl: item.productUrl || '#',
            affiliateUrl: item.affiliateUrl || '#'
          },
          item.quantity || 1
        );
      }
      if (showToast) showToast(`Added "${item.title.slice(0, 26)}..." to your cart!`);
    } catch {
      if (showToast) showToast('Failed to add item to basket.');
    } finally {
      setReorderingItemId(null);
    }
  };

  const getStatusBadge = (status: OrderStatus | string) => {
    const s = String(status || '').toUpperCase();
    if (s === 'DELIVERED') {
      return { label: 'Delivered', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', icon: CheckCircle2 };
    }
    if (s === 'OUT_FOR_DELIVERY') {
      return { label: 'Out for Delivery', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid #f59e0b', icon: Truck };
    }
    if (s === 'SHIPPED') {
      return { label: 'Shipped', bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: '1px solid #8b5cf6', icon: Package };
    }
    if (s === 'PACKED') {
      return { label: 'Packed', bg: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', border: '1px solid #6366f1', icon: Package };
    }
    if (s === 'CANCELLED') {
      return { label: 'Cancelled', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid #ef4444', icon: AlertTriangle };
    }
    if (s === 'COD_PENDING') {
      return { label: 'COD Pending', bg: 'rgba(20, 184, 166, 0.15)', color: '#14b8a6', border: '1px solid #14b8a6', icon: Clock };
    }
    if (s === 'PENDING_VERIFICATION' || s === 'PAYMENT_PENDING') {
      return { label: 'Payment Pending', bg: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid #eab308', icon: Clock };
    }
    return { label: 'Placed', bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid #3b82f6', icon: CheckCircle2 };
  };

  // ----------------------------------------------------
  // LOADING SKELETON
  // ----------------------------------------------------
  if (isLoading) {
    return (
      <div className="order-detail-root">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <button
            onClick={() => onNavigateRoute('/orders')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} /> Back to My Orders
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '30px', height: '180px', animation: 'pulse 1.5s infinite ease-in-out', marginBottom: '20px', background: 'var(--bg-subtle)' }} />
        <div className="glass-panel" style={{ padding: '30px', height: '240px', animation: 'pulse 1.5s infinite ease-in-out', marginBottom: '20px', background: 'var(--bg-subtle)' }} />
      </div>
    );
  }

  // ----------------------------------------------------
  // 404 NOT FOUND STATE (OWNERSHIP ISOLATION PROTECTED)
  // ----------------------------------------------------
  if (isNotFound || !order) {
    return (
      <div style={{ maxWidth: '680px', margin: '40px auto', textAlign: 'center', padding: '0 20px' }}>
        <div className="glass-panel" style={{ padding: '50px 24px', background: 'var(--bg-card)' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--accent-rose)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <XCircle size={36} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
            Order Not Found (404)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
            The order you are looking for does not exist or belongs to another user account. For your privacy and security, cross-account order access is strictly restricted.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => onNavigateRoute('/orders')}
              style={{
                padding: '12px 22px',
                borderRadius: '10px',
                background: 'var(--primary)',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Back to My Orders
            </button>
            <button
              onClick={() => onNavigateRoute('/')}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(order.status);
  const StatusIcon = statusBadge.icon;
  const items = order.orderItems || order.items || [];
  const breakdown = order.priceBreakdown || {
    itemsTotal: order.totalAmount,
    discountSavings: 0,
    deliveryCharges: 0,
    codFee: 0,
    taxes: 0,
    grandTotal: order.totalAmount
  };
  const isCodOrder = String(order.paymentMethod || '').toUpperCase().includes('COD') ||
    String(order.paymentDetails?.method || '').toUpperCase().includes('COD') ||
    order.status === 'COD_PENDING';
  const isPaid = order.paymentStatus === 'PAID' ||
    Boolean(order.paidOnlineBeforeDelivery) ||
    order.paymentDetails?.status === 'PAID';
  const isCancelledOrDelivered = order.status === 'CANCELLED' || order.status === 'DELIVERED';
  const isCodEligible = (order.isCodEligibleForPrePayment || isCodOrder) && !isPaid && !isCancelledOrDelivered;

  const payment = order.paymentDetails || {
    method: order.paymentMethod || 'Instant Gateway',
    status: isPaid ? 'PAID' : (isCodOrder ? 'PENDING' : 'PAID'),
    paymentId: order.paymentId || 'N/A',
    isDemo: true
  };
  const address = order.deliveryAddress;
  const comparison = order.priceComparisonSummary;

  const formattedPlacedDate = new Date(order.orderedAt).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="order-detail-root">
      {/* Back to Orders Button */}
      <div style={{ marginBottom: '18px' }}>
        <button
          onClick={() => onNavigateRoute('/orders')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            padding: 0
          }}
        >
          <ArrowLeft size={16} /> Back to My Orders
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. HEADER SECTION                                     */}
      {/* ---------------------------------------------------- */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          marginBottom: '24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '18px',
            marginBottom: '18px'
          }}
        >
          {/* Order ID & Date */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px', margin: 0 }}>
                Order #{order.orderId}
              </h2>
              <button
                onClick={handleCopyId}
                title="Copy Order ID"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  color: copiedId ? 'var(--accent-green)' : 'var(--text-secondary)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {copiedId ? <Check size={13} color="var(--accent-green)" /> : <Copy size={13} />}
                <span>{copiedId ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Placed on {formattedPlacedDate}
            </div>
          </div>

          {/* Status Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: statusBadge.bg,
              color: statusBadge.color,
              border: statusBadge.border,
              padding: '6px 16px',
              borderRadius: '24px',
              fontSize: '0.88rem',
              fontWeight: 800
            }}
          >
            <StatusIcon size={16} />
            <span>{statusBadge.label}</span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          {/* Track Order */}
          <button
            onClick={handleScrollToTimeline}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid var(--primary)',
              color: 'var(--primary)',
              padding: '9px 16px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Truck size={15} />
            <span>Track Order</span>
          </button>

          {/* Download Invoice / Receipt (PDF) */}
          <button
            onClick={handleDownloadInvoice}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '9px 16px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Download size={15} />
            <span>Download Invoice / Receipt (PDF)</span>
          </button>

          {/* Need Help? */}
          <button
            onClick={() => setShowSupportModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '9px 16px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <HelpCircle size={15} color="var(--primary)" />
            <span>Need Help?</span>
          </button>

          {/* Rate Delivery Button in Header for Delivered Orders */}
          {order.status === 'DELIVERED' && (
            <button
              onClick={() => setShowFeedbackModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: order.customerFeedback
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: order.customerFeedback ? '1px solid rgba(245, 158, 11, 0.4)' : 'none',
                color: order.customerFeedback ? '#f59e0b' : '#fff',
                padding: '9px 16px',
                borderRadius: '10px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: order.customerFeedback ? 'none' : '0 2px 10px rgba(245, 158, 11, 0.3)'
              }}
            >
              <Star size={15} fill={order.customerFeedback ? '#f59e0b' : '#fff'} />
              <span>{order.customerFeedback ? `${order.customerFeedback.rating}★ Review` : 'Rate Delivery (1-5★)'}</span>
            </button>
          )}

          {/* Cancel Order (Only if allowed) */}
          {order.canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ef4444',
                padding: '9px 16px',
                borderRadius: '10px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginLeft: 'auto'
              }}
            >
              <XCircle size={15} />
              <span>Cancel Order</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1.5 PAY BEFORE DELIVERY SECTION (FOR COD ORDERS)      */}
      {/* ---------------------------------------------------- */}
      {(isCodOrder || order.isCodEligibleForPrePayment || isPaid) && (
        <div
          className="glass-panel"
          style={{
            padding: '20px 24px',
            marginBottom: '24px',
            background: isPaid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(99, 102, 241, 0.08)',
            border: isPaid ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '16px'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Zap size={20} color={isPaid ? '#10b981' : 'var(--primary)'} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {isPaid ? 'Paid Online — Ready for Delivery' : 'Pay Online Before Delivery'}
                </h3>
                {isPaid && (
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#10b981',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '2px 10px',
                      borderRadius: '12px'
                    }}
                  >
                    Paid Online
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                {isPaid
                  ? 'Payment successful! Your order will be delivered as scheduled. Zero cash collection required upon delivery.'
                  : 'Skip doorstep cash hassle. Pay online securely now via UPI, Cards, Netbanking or Wallets before courier arrives.'}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', marginTop: '14px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Payment Status: </span>
                  <strong style={{ color: isPaid ? 'var(--accent-green)' : '#eab308' }}>
                    {isPaid ? 'Paid' : 'Pending'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Amount Due: </span>
                  <strong style={{ color: isPaid ? 'var(--accent-green)' : 'var(--text-main)' }}>
                    {isPaid ? '₹0 (Paid Online)' : `₹${order.totalAmount.toLocaleString()}`}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Expected Delivery: </span>
                  <strong style={{ color: 'var(--text-secondary)' }}>
                    {order.estimatedDeliveryDate || 'Within 2-3 Business Days'}
                  </strong>
                </div>
                {isPaid && (payment.paymentId || order.paymentId) && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Transaction Ref: </span>
                    <code style={{ color: 'var(--primary)', fontWeight: 700 }}>
                      {payment.paymentId || order.paymentId}
                    </code>
                  </div>
                )}
              </div>
            </div>

            {isCodEligible && (
              <button
                onClick={() => setShowPayModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Zap size={18} />
                <span>Pay Before Delivery</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 1.6 DELIVERED CUSTOMER 5-STAR FEEDBACK CARD           */}
      {/* ---------------------------------------------------- */}
      {order.status === 'DELIVERED' && (
        <div
          className="glass-panel"
          style={{
            padding: '22px 24px',
            marginBottom: '24px',
            background: order.customerFeedback
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%)'
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(245, 158, 11, 0.04) 100%)',
            border: order.customerFeedback
              ? '1px solid rgba(245, 158, 11, 0.3)'
              : '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '16px'
          }}
        >
          {order.customerFeedback ? (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        fill={star <= (order.customerFeedback?.rating || 5) ? '#f59e0b' : 'none'}
                        color={star <= (order.customerFeedback?.rating || 5) ? '#f59e0b' : 'rgba(148, 163, 184, 0.4)'}
                        strokeWidth={2}
                      />
                    ))}
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b', margin: 0 }}>
                    {order.customerFeedback.rating} / 5 Stars — Verified Customer Feedback
                  </h4>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      fontWeight: 700
                    }}
                  >
                    ✓ Verified Delivery Review
                  </span>
                </div>

                <button
                  onClick={() => setShowFeedbackModal(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Edit3 size={13} />
                  <span>Edit Review</span>
                </button>
              </div>

              {order.customerFeedback.comment && (
                <p style={{ margin: '8px 0 12px', fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{order.customerFeedback.comment}"
                </p>
              )}

              {order.customerFeedback.tags && order.customerFeedback.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                  {order.customerFeedback.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '0.76rem',
                        padding: '4px 10px',
                        borderRadius: '16px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: 'var(--text-secondary)',
                        fontWeight: 500
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <CheckCircle2 size={20} color="#10b981" />
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Package Delivered! How was your experience?
                  </h4>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  Rate your doorstep delivery and product quality to help improve VoiceCart.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setShowFeedbackModal(true)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px'
                      }}
                      title={`Rate ${star} Stars`}
                    >
                      <Star
                        size={24}
                        fill="#f59e0b"
                        color="#f59e0b"
                        style={{ opacity: 0.85, transition: 'transform 0.15s ease' }}
                      />
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowFeedbackModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    border: 'none',
                    color: '#fff',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
                  }}
                >
                  <Star size={15} fill="#fff" />
                  <span>Rate Delivery (1-5★)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. STATUS TIMELINE                                    */}
      {/* ---------------------------------------------------- */}
      <div
        ref={timelineRef}
        className="glass-panel"
        style={{
          padding: '24px',
          marginBottom: '24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={20} color="var(--primary)" />
              <span>Delivery Status Timeline</span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {order.isExternal
                ? `Official store tracking linked to ${order.store.toUpperCase()}`
                : 'Order Tracking • Live logistics timeline'}
            </span>
          </div>

          {order.isExternal ? (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid var(--primary)',
                color: 'var(--primary)',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              <span>Track on {order.store.toUpperCase()}</span>
              <ExternalLink size={13} />
            </a>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
            >
              <Sparkles size={14} /> Expected Delivery: {order.estimatedDeliveryDate || '2-3 Days'}
            </div>
          )}
        </div>

        {/* Timeline Horizontal Steps Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))`, gap: '14px' }}>
          {order.timeline.map((step, idx) => {
            const isDone = step.completed;
            const isCurr = step.current;

            return (
              <div
                key={idx}
                style={{
                  padding: '16px 14px',
                  borderRadius: '12px',
                  background: isCurr
                    ? 'rgba(99, 102, 241, 0.12)'
                    : isDone
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'var(--bg-subtle)',
                  border: isCurr
                    ? '2px solid var(--primary)'
                    : isDone
                    ? '1px solid rgba(16, 185, 129, 0.35)'
                    : '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isDone ? (
                    <CheckCircle2 size={18} color="var(--accent-green)" />
                  ) : (
                    <Clock size={18} color="var(--text-dim)" />
                  )}
                  <span
                    style={{
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      color: isCurr ? 'var(--primary)' : isDone ? 'var(--text-main)' : 'var(--text-muted)'
                    }}
                  >
                    {step.stage}
                  </span>
                </div>

                <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                  {step.description}
                </p>

                {step.timestamp && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 'auto', paddingTop: '4px' }}>
                    {new Date(step.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. ITEMS SECTION                                      */}
      {/* ---------------------------------------------------- */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          marginBottom: '24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)'
        }}
      >
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingBag size={20} color="var(--primary)" />
          <span>Items Ordered ({items.length})</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {items.map((item: any) => {
            const storeName = (item.store || order.store || 'amazon').toLowerCase();
            const mrp = Number(item.mrp || item.price || 1499);
            const price = Number(item.price || item.currentPrice || 999);
            const isReordering = reorderingItemId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px minmax(0, 1fr) auto',
                  gap: '16px',
                  alignItems: 'center',
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)'
                }}
              >
                {/* Product Image */}
                <div style={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#fff' }}>
                  <ProductImage
                    src={item.imageUrl || item.product?.imageUrl || order.productImage}
                    alt={item.title || 'Ordered Product'}
                    store={order.store}
                    productId={item.productId || item.product?.productId}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>

                {/* Details */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background:
                          storeName === 'amazon' ? '#ff9900' : storeName === 'flipkart' ? '#2874f0' : storeName === 'meesho' ? '#f43397' : 'var(--primary)',
                        color: storeName === 'amazon' ? '#000' : '#fff'
                      }}
                    >
                      {storeName.toUpperCase()}
                    </span>
                    {item.brand && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Brand: {item.brand}
                      </span>
                    )}
                  </div>

                  <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </h4>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    <span>Qty: <strong>{item.quantity}</strong></span>
                    <span>•</span>
                    <span>Seller: <strong>{item.seller || 'Verified Store'}</strong></span>
                    <span>•</span>
                    <span style={{ color: 'var(--accent-green)' }}>{item.returnPolicy || '7 Days Return'}</span>
                  </div>
                </div>

                {/* Pricing & Item Actions */}
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      ₹{(price * item.quantity).toLocaleString()}
                    </div>
                    {mrp > price && (
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', textDecoration: 'line-through' }}>
                        ₹{(mrp * item.quantity).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {item.productUrl && (
                      <a
                        href={item.affiliateUrl || item.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          color: 'var(--primary)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <span>View product</span>
                        <ExternalLink size={12} />
                      </a>
                    )}

                    <button
                      onClick={() => handleBuyAgain(item)}
                      disabled={isReordering}
                      style={{
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        color: '#fff',
                        background: 'var(--primary)',
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        cursor: isReordering ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isReordering ? 'Adding...' : 'Buy again'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. PRICE SUMMARY & 5. PAYMENT DETAILS (2-COL)        */}
      {/* ---------------------------------------------------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* PRICE SUMMARY */}
        <div
          className="glass-panel"
          style={{
            padding: '22px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--primary)" />
              <span>Price Summary</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Items Subtotal:</span>
                <span>₹{breakdown.itemsTotal.toLocaleString()}</span>
              </div>

              {breakdown.discountSavings > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-green)', fontWeight: 600 }}>
                  <span>Discount Savings:</span>
                  <span>-₹{breakdown.discountSavings.toLocaleString()}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Delivery Charges:</span>
                <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>FREE</span>
              </div>

              {breakdown.codFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>COD Handling Fee:</span>
                  <span>₹{breakdown.codFee}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Estimated Taxes & GST:</span>
                <span>₹0.00 (Included)</span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px dashed var(--border-color)'
            }}
          >
            <span>Grand Total Paid:</span>
            <span style={{ color: 'var(--primary)' }}>₹{breakdown.grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* PAYMENT DETAILS */}
        <div
          className="glass-panel"
          style={{
            padding: '22px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} color="var(--primary)" />
              <span>Payment Details</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Method:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{payment.method}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Status:</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: isPaid ? 'var(--accent-green)' : payment.status === 'REFUND_INITIATED' ? 'var(--accent-gold)' : '#eab308'
                  }}
                >
                  {isPaid ? 'Paid' : payment.status === 'REFUND_INITIATED' ? 'Refund Initiated' : 'Pending'}
                </span>
              </div>

              {order.paidOnlineBeforeDelivery && (
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.78rem', fontWeight: 600 }}>
                  ✓ Paid Online Pre-Delivery — Zero cash due on delivery
                </div>
              )}

              {isCodEligible && (
                <button
                  onClick={() => setShowPayModal(true)}
                  style={{
                    marginTop: '8px',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Zap size={16} />
                  <span>Pay Online Before Delivery</span>
                </button>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Reference ID:</span>
                <code style={{ color: 'var(--primary)', fontWeight: 700 }}>{payment.paymentId || 'N/A'}</code>
              </div>

              {payment.cardBrand && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Card Used:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {payment.cardBrand} •••• {payment.cardLast4 || '4242'}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Transaction Time:</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {new Date(payment.transactionTime || order.orderedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Secondary partner store action if available */}
          {((order.items?.[0] as any)?.productUrl || (order.items?.[0] as any)?.product?.productUrl || (order as any).productUrl) && (
            <div style={{ marginTop: '14px' }}>
              <a
                href={(order.items?.[0] as any)?.productUrl || (order.items?.[0] as any)?.product?.productUrl || (order as any).productUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                <span>Complete purchase on {order.store.toUpperCase()}</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}

          {/* Quiet Notice */}
          <div
            style={{
              marginTop: '16px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-dim)',
              fontSize: '0.72rem',
              textAlign: 'center'
            }}
          >
            Payments in this build are simulated; no money is charged.
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 6. DELIVERY DETAILS                                   */}
      {/* ---------------------------------------------------- */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          marginBottom: '24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)'
        }}
      >
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={20} color="var(--primary)" />
          <span>Delivery Details</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Address */}
          <div>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Shipping Address
            </span>
            {address ? (
              <div style={{ marginTop: '6px', color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700 }}>{address.fullName}</div>
                <div>{address.addressLine1}</div>
                {address.addressLine2 && <div>{address.addressLine2}</div>}
                <div>{address.city}, {address.state} - <strong>{address.pincode}</strong></div>
                <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>Phone: {address.phone}</div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Default Registered Address</div>
            )}
          </div>

          {/* Delivery Method & Expected Date */}
          <div>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Shipping Method & Schedule
            </span>
            <div style={{ marginTop: '6px', color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                {order.deliveryMethod || 'VoiceCart Express Air Courier'}
              </div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                Estimated Delivery: <strong style={{ color: 'var(--accent-green)' }}>{order.estimatedDeliveryDate || '2-3 Business Days'}</strong>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Verified contactless OTP delivery upon doorstep arrival.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 7. PRICE COMPARISON SUMMARY (VOICECART UNIQUE FEATURE) */}
      {/* ---------------------------------------------------- */}
      {comparison && (
        <div
          className="glass-panel"
          style={{
            padding: '24px',
            marginBottom: '24px',
            background: 'rgba(99, 102, 241, 0.04)',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="var(--accent-gold)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Live Price Comparison Summary
              </h3>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-green)',
                padding: '4px 10px',
                borderRadius: '6px'
              }}
            >
              SMART SAVINGS ANALYSIS
            </span>
          </div>

          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Before placing this order, VoiceCart scanned live inventories across 3 major marketplaces to guarantee you the most optimal deal.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            {comparison.storesCompared.map((c) => {
              const isChosen = c.store.toLowerCase() === order.store.toLowerCase();
              return (
                <div
                  key={c.store}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: isChosen ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card)',
                    border: isChosen ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {c.store.toUpperCase()}
                    </span>
                    {isChosen && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, background: 'var(--primary)', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
                        CHOSEN ✓
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: isChosen ? 'var(--primary)' : 'var(--text-main)' }}>
                    ₹{c.price.toLocaleString()}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {c.deliveryDays ? `${c.deliveryDays} Day Delivery` : 'Standard Delivery'}
                  </span>
                </div>
              );
            })}
          </div>

          {comparison.savingsVsHighest > 0 && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--accent-green)',
                fontSize: '0.84rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <TrendingDown size={18} />
              <span>You saved ₹{comparison.savingsVsHighest.toLocaleString()} compared to the highest priced marketplace option!</span>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 8. ORDER ACTIVITY LOG                                 */}
      {/* ---------------------------------------------------- */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          marginBottom: '24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)'
        }}
      >
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} color="var(--primary)" />
          <span>Order Activity Log</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
          {(order.activityLog || []).map((entry, idx) => (
            <div
              key={entry.id || idx}
              style={{
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
                paddingBottom: '12px',
                borderBottom: idx < (order.activityLog?.length || 1) - 1 ? '1px solid var(--border-subtle)' : 'none'
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: entry.type === 'cancellation' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                  color: entry.type === 'cancellation' ? '#ef4444' : 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}
              >
                {entry.type === 'cancellation' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {entry.title}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {new Date(entry.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0', lineHeight: 1.4 }}>
                  {entry.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 9. SUPPORT SECTION                                    */}
      {/* ---------------------------------------------------- */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={20} color="var(--primary)" />
            <span>Need Help with this Order?</span>
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '480px' }}>
            Have questions about package tracking, return policy, or invoices? Our 24/7 shopping support team is ready to assist you.
          </p>

          <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Phone size={13} color="var(--primary)" /> 1800-VOICE-CART
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mail size={13} color="var(--primary)" /> support@voicecart.in
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowSupportModal(true)}
          style={{
            padding: '12px 22px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            border: 'none',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px var(--primary-glow)'
          }}
        >
          Open Support Request
        </button>
      </div>

      {/* CANCEL MODAL */}
      {showCancelModal && (
        <CancelOrderModal
          order={order}
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onCancelled={(updated) => {
            setOrder(updated);
            if (showToast) showToast('Order successfully cancelled. Refund initiated.');
          }}
        />
      )}

      {/* SUPPORT MODAL */}
      {showSupportModal && (
        <OrderSupportModal
          order={order}
          isOpen={showSupportModal}
          onClose={() => setShowSupportModal(false)}
        />
      )}

      {/* PAY BEFORE DELIVERY MODAL */}
      {showPayModal && order && (
        <PaymentModal
          isOpen={showPayModal}
          onClose={() => setShowPayModal(false)}
          existingOrder={order}
          mode="pay_before_delivery"
          amount={order.totalAmount}
          onPaymentSuccess={(updatedOrder, _payId, _method) => {
            setOrder(updatedOrder);
            if (showToast) {
              showToast('Payment successful! Your order will be delivered as scheduled.');
            }
          }}
          onNavigateToOrders={() => {
            setShowPayModal(false);
            api.getOrderById(orderId).then((o: any) => { if (o) setOrder(o.order || o); });
          }}
        />
      )}

      {/* 5-STAR CUSTOMER DELIVERY FEEDBACK MODAL */}
      {order && (
        <OrderFeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          order={order}
          onFeedbackSubmitted={(updated) => {
            setOrder(updated);
            if (showToast) {
              showToast('Thank you! Your 5-star delivery review has been saved.');
            }
          }}
        />
      )}
    </div>
  );
};
