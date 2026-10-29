import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Plus,
  ShoppingBag,
  Calendar,
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  RefreshCw,
  ChevronLeft,
  Store,
  Zap,
  Star,
  Edit3,
  MessageSquare
} from 'lucide-react';
import { OrderRecord, OrderStatus, StoreName } from '../types';
import { api } from '../services/api';
import { AddExternalOrderModal } from '../components/orders/OrdersModals';
import { PaymentModal } from '../components/PaymentModal';
import { OrderFeedbackModal } from '../components/OrderFeedbackModal';
import { SupportedLanguage, translations } from '../i18n/translations';
import { ProductImage } from '../components/ProductImage';

interface Props {
  onNavigateRoute: (route: string) => void;
  onAddToCart?: (product: any, quantity?: number) => void;
  language?: SupportedLanguage;
  showToast?: (msg: string) => void;
}

export const OrdersListPage: React.FC<Props> = ({
  onNavigateRoute,
  language = 'en',
  showToast
}) => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters State
  const [activeStatusTab, setActiveStatusTab] = useState<'all' | 'in_progress' | 'delivered' | 'cancelled'>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modals & Interactivity
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [payingOrder, setPayingOrder] = useState<OrderRecord | null>(null);
  const [feedbackOrder, setFeedbackOrder] = useState<OrderRecord | null>(null);

  const t = translations[language] || translations.en;

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.getOrders({
        status: activeStatusTab === 'all' ? undefined : activeStatusTab,
        store: selectedStore === 'all' ? undefined : selectedStore,
        dateRange: dateRange === 'all' ? undefined : dateRange,
        search: searchQuery.trim() ? searchQuery.trim() : undefined,
        sort: sortBy,
        page: currentPage,
        limit: 10
      });

      setOrders(res.orders || []);
      setTotalCount(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      console.error('Failed to load orders:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to load your orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [activeStatusTab, selectedStore, dateRange, searchQuery, sortBy, currentPage]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedOrderId(id);
    setTimeout(() => {
      setCopiedOrderId((cur) => (cur === id ? null : cur));
    }, 2000);
  };

  const handleReorder = async (order: OrderRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setReorderingId(order.orderId);
    try {
      const res = await api.reorderOrder(order.orderId);
      if (showToast) {
        showToast(res.message || 'Items added to your basket with live prices verified!');
      }
      onNavigateRoute('/cart');
    } catch (err: any) {
      if (showToast) {
        showToast(err.response?.data?.error || 'Failed to reorder items.');
      }
    } finally {
      setReorderingId(null);
    }
  };

  const getStatusBadge = (status: OrderStatus | string) => {
    const s = String(status || '').toUpperCase();
    if (s === 'DELIVERED') {
      return {
        label: 'Delivered',
        bg: 'rgba(16, 185, 129, 0.15)',
        color: '#10b981',
        border: '1px solid #10b981',
        icon: CheckCircle2
      };
    }
    if (s === 'OUT_FOR_DELIVERY') {
      return {
        label: 'Out for Delivery',
        bg: 'rgba(245, 158, 11, 0.15)',
        color: '#f59e0b',
        border: '1px solid #f59e0b',
        icon: Truck
      };
    }
    if (s === 'SHIPPED') {
      return {
        label: 'Shipped',
        bg: 'rgba(139, 92, 246, 0.15)',
        color: '#8b5cf6',
        border: '1px solid #8b5cf6',
        icon: Package
      };
    }
    if (s === 'PACKED') {
      return {
        label: 'Packed',
        bg: 'rgba(99, 102, 241, 0.15)',
        color: '#6366f1',
        border: '1px solid #6366f1',
        icon: Package
      };
    }
    if (s === 'CANCELLED') {
      return {
        label: 'Cancelled',
        bg: 'rgba(239, 68, 68, 0.15)',
        color: '#ef4444',
        border: '1px solid #ef4444',
        icon: AlertTriangle
      };
    }
    if (s === 'COD_PENDING') {
      return {
        label: 'COD Pending',
        bg: 'rgba(20, 184, 166, 0.15)',
        color: '#14b8a6',
        border: '1px solid #14b8a6',
        icon: Clock
      };
    }
    if (s === 'PENDING_VERIFICATION' || s === 'PAYMENT_PENDING') {
      return {
        label: 'Payment Pending',
        bg: 'rgba(234, 179, 8, 0.15)',
        color: '#eab308',
        border: '1px solid #eab308',
        icon: Clock
      };
    }
    return {
      label: 'Placed',
      bg: 'rgba(59, 130, 246, 0.15)',
      color: '#3b82f6',
      border: '1px solid #3b82f6',
      icon: CheckCircle2
    };
  };

  const getStoreBadge = (store: StoreName | string) => {
    const s = String(store || '').toLowerCase();
    if (s === 'amazon') return { label: 'AMAZON', bg: '#ff9900', color: '#000' };
    if (s === 'flipkart') return { label: 'FLIPKART', bg: '#2874f0', color: '#fff' };
    if (s === 'meesho') return { label: 'MEESHO', bg: '#f43397', color: '#fff' };
    return { label: 'VOICECART', bg: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' };
  };

  return (
    <div className="orders-page-root">
      {/* Top Header Section */}
      <div className="orders-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px', margin: 0 }}>
              My Orders
            </h2>
            {!isLoading && (
              <span
                style={{
                  background: 'var(--bg-pill)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--primary)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}
              >
                {totalCount} {totalCount === 1 ? 'order' : 'orders'}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '4px' }}>
            View live status, multi-store price comparisons, download PDF invoices, or add orders from Amazon/Flipkart
          </p>
        </div>

        {/* Add External Order Action */}
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            border: 'none',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '12px',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 15px var(--primary-glow)'
          }}
        >
          <Plus size={16} />
          <span>Add Order from Amazon / Flipkart / Meesho</span>
        </button>
      </div>

      {/* STATUS TABS */}
      <div className="orders-status-tabs">
        {[
          { id: 'all', label: 'All Orders' },
          { id: 'in_progress', label: 'In Progress' },
          { id: 'delivered', label: 'Delivered' },
          { id: 'cancelled', label: 'Cancelled' }
        ].map((tab) => {
          const isActive = activeStatusTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveStatusTab(tab.id as any);
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="glass-panel orders-filter-bar">
        {/* Search input */}
        <div className="orders-filter-search-box">
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input
            type="text"
            placeholder="Search by product name, brand, or order ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="glass-input search-bar-input search-input"
            data-search-bar="true"
            style={{ width: '100%', paddingLeft: '36px', fontSize: '0.85rem', caretColor: 'auto' }}
          />
        </div>

        {/* Dropdowns group */}
        <div className="orders-filter-dropdowns">
          {/* Store filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Store size={15} color="var(--text-muted)" />
            <select
              value={selectedStore}
              onChange={(e) => {
                setSelectedStore(e.target.value);
                setCurrentPage(1);
              }}
              className="glass-input"
              style={{ padding: '8px 12px', fontSize: '0.82rem', background: 'var(--bg-input)' }}
            >
              <option value="all">All Stores</option>
              <option value="amazon">Amazon India</option>
              <option value="flipkart">Flipkart</option>
              <option value="meesho">Meesho</option>
              <option value="voicecart">VoiceCart Store</option>
            </select>
          </div>

          {/* Date Range filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} color="var(--text-muted)" />
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setCurrentPage(1);
              }}
              className="glass-input"
              style={{ padding: '8px 12px', fontSize: '0.82rem', background: 'var(--bg-input)' }}
            >
              <option value="all">All Time</option>
              <option value="30d">Last 30 Days</option>
              <option value="6m">Last 6 Months</option>
              <option value="2026">Year 2026</option>
              <option value="2025">Year 2025</option>
            </select>
          </div>

          {/* Sort filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={15} color="var(--text-muted)" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="glass-input"
              style={{ padding: '8px 12px', fontSize: '0.82rem', background: 'var(--bg-input)' }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#ef4444',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>{errorMessage}</span>
          <button
            onClick={fetchOrders}
            style={{ background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* SKELETON LOADER */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-panel"
              style={{
                padding: '20px',
                height: '140px',
                animation: 'pulse 1.5s infinite ease-in-out',
                background: 'var(--bg-subtle)'
              }}
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        /* EMPTY STATE */
        <div
          className="glass-panel"
          style={{
            padding: '60px 24px',
            textAlign: 'center',
            background: 'var(--bg-card)'
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <ShoppingBag size={34} color="var(--primary)" />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
            No orders found
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            {searchQuery || activeStatusTab !== 'all' || selectedStore !== 'all'
              ? 'No orders match your selected filters. Try clearing or relaxing your search query.'
              : 'You have not placed any orders yet. Speak your wish to compare live items across Amazon, Flipkart, and Meesho.'}
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => onNavigateRoute('/')}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                border: 'none',
                color: '#fff',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 15px var(--primary-glow)'
              }}
            >
              Start Shopping
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Paste Amazon / Flipkart SMS
            </button>
          </div>
        </div>
      ) : (
        /* ORDERS LIST CARDS */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {orders.map((order) => {
            const statusBadge = getStatusBadge(order.status);
            const storeBadge = getStoreBadge(order.store);
            const StatusIcon = statusBadge.icon;
            const items = order.orderItems || order.items || [];
            const firstItem = items[0];
            const extraItemsCount = items.length > 1 ? items.length - 1 : 0;
            const isCopied = copiedOrderId === order.orderId;
            const isReordering = reorderingId === order.orderId;

            const isCodOrder = String(order.paymentMethod || '').toUpperCase().includes('COD') ||
              String(order.paymentDetails?.method || '').toUpperCase().includes('COD') ||
              order.status === 'COD_PENDING';
            const isPaid = order.paymentStatus === 'PAID' ||
              Boolean(order.paidOnlineBeforeDelivery) ||
              order.paymentDetails?.status === 'PAID';
            const isCancelledOrDelivered = order.status === 'CANCELLED' || order.status === 'DELIVERED';
            const isCodEligible = (order.isCodEligibleForPrePayment || isCodOrder) && !isPaid && !isCancelledOrDelivered;

            const formattedDate = new Date(order.orderedAt).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={order.id}
                className="glass-panel order-card-panel"
              >
                {/* CARD TOP ROW: STORE, ORDER ID, DATE, STATUS BADGE */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    borderBottom: '1px solid var(--border-subtle)',
                    paddingBottom: '14px',
                    marginBottom: '16px'
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                    {/* Store Badge */}
                    <span
                      style={{
                        background: storeBadge.bg,
                        color: storeBadge.color,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {storeBadge.label}
                    </span>

                    {/* Order ID with Copy button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        #{order.orderId}
                      </span>
                      <button
                        onClick={(e) => handleCopy(order.orderId, e)}
                        title="Copy Order ID"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: isCopied ? 'var(--accent-green)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {isCopied ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
                      </button>
                    </div>

                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>•</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Placed on {formattedDate}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: statusBadge.bg,
                      color: statusBadge.color,
                      border: statusBadge.border,
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 700
                    }}
                  >
                    <StatusIcon size={14} />
                    <span>{statusBadge.label}</span>
                  </div>
                </div>

                {/* CARD BODY ROW: IMAGE, TITLES, PRICE, DELIVERY */}
                <div className="order-card-body">
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', minWidth: 0 }}>
                    {/* Thumbnail with +N more items label */}
                    <div style={{ position: 'relative', flexShrink: 0, width: '72px', height: '72px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#fff' }}>
                      <ProductImage
                        src={order.productImage || (firstItem as any)?.imageUrl || (firstItem as any)?.product?.imageUrl}
                        alt={order.productTitle || 'Ordered Product'}
                        store={order.store}
                        productId={(firstItem as any)?.productId || (firstItem as any)?.product?.productId || order.orderId}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                      {extraItemsCount > 0 && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '-4px',
                            right: '-4px',
                            background: 'var(--primary)',
                            color: '#fff',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '10px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                          }}
                        >
                          +{extraItemsCount} more
                        </span>
                      )}
                    </div>

                    {/* Titles and Metadata */}
                    <div style={{ minWidth: 0 }}>
                      <h4
                        onClick={() => onNavigateRoute(`/orders/${order.orderId}`)}
                        style={{
                          fontSize: '0.98rem',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          marginBottom: '4px',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {order.productTitle}
                      </h4>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span>
                          Payment: <strong style={{ color: 'var(--text-secondary)' }}>{order.paymentDetails?.method || order.paymentMethod || 'Instant Gateway'}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Expected Delivery: <strong style={{ color: 'var(--accent-green)' }}>{order.estimatedDeliveryDate || '2-3 Business Days'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price Column */}
                  <div className="order-card-price-col" style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      ₹{order.totalAmount.toLocaleString()}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                      Free Delivery
                    </span>
                  </div>
                </div>

                {/* PAY BEFORE DELIVERY SECTION FOR COD ORDERS */}
                {(isCodOrder || order.isCodEligibleForPrePayment || isPaid) && (
                  <div
                    style={{
                      marginTop: '12px',
                      marginBottom: '8px',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: isPaid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(99, 102, 241, 0.08)',
                      border: isPaid ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(99, 102, 241, 0.25)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.82rem' }}>
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
                    </div>

                    {isPaid ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                        <span
                          style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#10b981',
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <CheckCircle2 size={13} /> Paid Online
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                          Ref: <code>{order.paymentId || order.paymentDetails?.paymentId}</code> • {order.paymentDetails?.method || 'Online'}
                        </span>
                      </div>
                    ) : isCodEligible ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPayingOrder(order);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          border: 'none',
                          color: '#fff',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <Zap size={14} />
                        <span>Pay Before Delivery</span>
                      </button>
                    ) : null}
                  </div>
                )}

                {/* DELIVERED ORDER: 5-STAR CUSTOMER FEEDBACK & REVIEW SECTION */}
                {order.status === 'DELIVERED' && (
                  <div
                    style={{
                      marginTop: '14px',
                      padding: '14px 16px',
                      background: order.customerFeedback
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%)'
                        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(245, 158, 11, 0.04) 100%)',
                      border: order.customerFeedback
                        ? '1px solid rgba(245, 158, 11, 0.3)'
                        : '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {order.customerFeedback ? (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={16}
                                  fill={star <= (order.customerFeedback?.rating || 5) ? '#f59e0b' : 'none'}
                                  color={star <= (order.customerFeedback?.rating || 5) ? '#f59e0b' : 'rgba(148, 163, 184, 0.4)'}
                                  strokeWidth={2}
                                />
                              ))}
                            </div>
                            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f59e0b' }}>
                              {order.customerFeedback.rating} / 5 Stars
                            </span>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                                fontWeight: 700
                              }}
                            >
                              ✓ Verified Customer Review
                            </span>
                          </div>

                          <button
                            onClick={() => setFeedbackOrder(order)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Edit3 size={12} />
                            <span>Edit Review</span>
                          </button>
                        </div>

                        {order.customerFeedback.comment && (
                          <p style={{ margin: '8px 0 4px', fontSize: '0.82rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: 1.4 }}>
                            "{order.customerFeedback.comment}"
                          </p>
                        )}

                        {order.customerFeedback.tags && order.customerFeedback.tags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                            {order.customerFeedback.tags.map((tag) => (
                              <span
                                key={tag}
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>
                            <CheckCircle2 size={16} />
                            <span>Package Delivered! How was your experience?</span>
                          </div>
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            Rate this delivery from 1 to 5 stars to help fellow shoppers
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: '3px' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setFeedbackOrder(order)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '2px'
                                }}
                                title={`Rate ${star} Stars`}
                              >
                                <Star
                                  size={20}
                                  fill="#f59e0b"
                                  color="#f59e0b"
                                  style={{ opacity: 0.85, transition: 'transform 0.15s ease' }}
                                />
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => setFeedbackOrder(order)}
                            style={{
                              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                              border: 'none',
                              color: '#fff',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                            }}
                          >
                            <Star size={13} fill="#fff" />
                            <span>Rate Delivery (1-5★)</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* CARD ACTIONS ROW */}
                <div className="order-card-actions">
                  {/* Pay Before Delivery Primary Action */}
                  {isCodEligible && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPayingOrder(order);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        color: '#fff',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                      }}
                    >
                      <Zap size={14} />
                      <span>Pay Before Delivery</span>
                    </button>
                  )}

                  {/* 5-Star Feedback Action for Delivered Orders */}
                  {order.status === 'DELIVERED' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFeedbackOrder(order);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: order.customerFeedback
                          ? 'rgba(245, 158, 11, 0.12)'
                          : 'linear-gradient(135deg, #f59e0b, #d97706)',
                        border: order.customerFeedback ? '1px solid rgba(245, 158, 11, 0.4)' : 'none',
                        color: order.customerFeedback ? '#f59e0b' : '#fff',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: order.customerFeedback ? 'none' : '0 2px 8px rgba(245, 158, 11, 0.25)'
                      }}
                    >
                      <Star size={14} fill={order.customerFeedback ? '#f59e0b' : '#fff'} />
                      <span>{order.customerFeedback ? `${order.customerFeedback.rating}★ Feedback` : 'Rate (1-5★)'}</span>
                    </button>
                  )}

                  {/* Reorder Button */}
                  <button
                    onClick={(e) => handleReorder(order, e)}
                    disabled={isReordering}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: isReordering ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <RotateCcw size={14} className={isReordering ? 'mic-active-pulse' : ''} />
                    <span>{isReordering ? 'Adding...' : 'Reorder'}</span>
                  </button>

                  {/* Track Order Button */}
                  {order.isExternal ? (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid var(--primary)',
                        color: 'var(--primary)',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <Truck size={14} />
                      <span>Track on {order.store.toUpperCase()}</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <button
                      onClick={() => onNavigateRoute(`/orders/${order.orderId}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid var(--primary)',
                        color: 'var(--primary)',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Truck size={14} />
                      <span>Track Order</span>
                    </button>
                  )}

                  {/* View Details Button */}
                  <button
                    onClick={() => onNavigateRoute(`/orders/${order.orderId}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                      border: 'none',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 10px var(--primary-glow)'
                    }}
                  >
                    <span>View Details</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  color: currentPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ChevronLeft size={14} /> Previous
              </button>

              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  color: currentPage === totalPages ? 'var(--text-dim)' : 'var(--text-main)',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add External Order Modal */}
      {showAddModal && (
        <AddExternalOrderModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onOrderAdded={(newOrder) => {
            setOrders((prev) => [newOrder, ...prev]);
            setTotalCount((c) => c + 1);
            if (showToast) showToast('External order tracked successfully!');
          }}
        />
      )}

      {/* Pay Before Delivery Checkout Modal */}
      {payingOrder && (
        <PaymentModal
          isOpen={Boolean(payingOrder)}
          onClose={() => setPayingOrder(null)}
          existingOrder={payingOrder}
          mode="pay_before_delivery"
          amount={payingOrder.totalAmount}
          onPaymentSuccess={(_orderRecord, _paymentId, _method) => {
            if (showToast) {
              showToast('Payment successful! Your order will be delivered as scheduled.');
            }
            fetchOrders();
          }}
          onNavigateToOrders={(orderId) => {
            setPayingOrder(null);
            if (orderId) {
              onNavigateRoute(`/orders/${orderId}`);
            } else {
              fetchOrders();
            }
          }}
        />
      )}

      {/* 5-STAR CUSTOMER DELIVERY FEEDBACK MODAL */}
      <OrderFeedbackModal
        isOpen={Boolean(feedbackOrder)}
        onClose={() => setFeedbackOrder(null)}
        order={feedbackOrder}
        onFeedbackSubmitted={(updated) => {
          setOrders((prev) =>
            prev.map((o) => (o.orderId === updated.orderId || o.id === updated.id ? updated : o))
          );
          if (showToast) {
            showToast('Thank you! Your 5-star delivery feedback has been saved.');
          }
        }}
      />
    </div>
  );
};
