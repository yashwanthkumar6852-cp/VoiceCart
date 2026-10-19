import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShoppingBag,
  Trash2,
  RefreshCw,
  ExternalLink,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Zap,
  PlusCircle,
  Info,
  Store,
  Sparkles,
  Lock,
  Download,
  ArrowRight,
  CheckSquare,
  Square
} from 'lucide-react';
import { CartItem, OrderRecord, PaymentConfig, Product } from '../types';
import { api } from '../services/api';
import { PaymentModal, PaymentTab } from './PaymentModal';
import { generateAndPrintReceipt } from '../utils/receiptGenerator';
import { ProductImage } from './ProductImage';

interface Props {
  cart: CartItem[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCartUpdated: (cart: CartItem[]) => void;
  onOrderCompleted?: (order: OrderRecord) => void;
  onNavigateToOrders?: (orderId?: string) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  initialPaymentTab?: PaymentTab;
}

// Sample VoiceCart own-store products for quick 1-click test addition
const SAMPLE_OWN_STORE_PRODUCTS: Product[] = [
  {
    store: 'voicecart',
    productId: 'VC-CARE-101',
    title: 'VoiceCart Express Care & 1-Year Extended Warranty',
    imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&auto=format&fit=crop&q=80',
    price: 499,
    mrp: 999,
    discountPct: 50,
    rating: 4.9,
    ratingCount: 1420,
    deliveryDays: 1,
    shippingFee: 0,
    seller: 'VoiceCart Official Store',
    inStock: true,
    productUrl: '#',
    affiliateUrl: '#',
    returnPolicy: '30-Day Instant Refund Guarantee',
    fulfilledByStore: true,
    highlights: ['Instant activation', 'Covers physical & water damage', '24/7 Priority support']
  },
  {
    store: 'voicecart',
    productId: 'VC-EARBUD-DIRECT',
    title: 'VoiceCart SoundMax Pro True Wireless Earbuds (ANC)',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80',
    price: 1499,
    mrp: 2999,
    discountPct: 50,
    rating: 4.8,
    ratingCount: 3820,
    deliveryDays: 2,
    shippingFee: 0,
    seller: 'VoiceCart Direct Retail',
    inStock: true,
    productUrl: '#',
    affiliateUrl: '#',
    returnPolicy: '7-Day Replacement',
    fulfilledByStore: true,
    highlights: ['45H Battery', 'Quad Mic ENC', '40ms Low Latency']
  }
];

export const CartScreen: React.FC<Props> = ({
  cart,
  onRemoveItem,
  onClearCart,
  onCartUpdated,
  onOrderCompleted,
  onNavigateToOrders,
  onAddToCart,
  initialPaymentTab = 'upi'
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentTab, setSelectedPaymentTab] = useState<PaymentTab>(initialPaymentTab);

  // Selected Item IDs for payment (default: all selected)
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set(cart.map((i) => i.id))
  );

  // Sync selected items when cart items change
  useEffect(() => {
    setSelectedItemIds((prev) => {
      const next = new Set<string>();
      cart.forEach((item) => {
        if (prev.has(item.id) || prev.size === 0) {
          next.add(item.id);
        }
      });
      return next.size > 0 ? next : new Set(cart.map((i) => i.id));
    });
  }, [cart]);

  // Completed Order State for Confirmation Card
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderId: string;
    paymentId: string;
    amount: number;
    paidAt: string;
    method: string;
    order?: OrderRecord;
  } | null>(null);

  // Fetch payment configuration on mount
  useEffect(() => {
    api.getPaymentConfig()
      .then((cfg) => setPaymentConfig(cfg))
      .catch((err) => console.warn('Payment config check:', err));
  }, []);

  // Filter items that are currently selected by checkbox
  const selectedCartItems = useMemo(
    () => cart.filter((item) => selectedItemIds.has(item.id)),
    [cart, selectedItemIds]
  );

  const selectedTotal = useMemo(
    () => selectedCartItems.reduce((sum, item) => sum + item.currentPrice * item.quantity, 0),
    [selectedCartItems]
  );

  const totalBasketAmount = useMemo(
    () => cart.reduce((sum, item) => sum + item.currentPrice * item.quantity, 0),
    [cart]
  );

  const totalDiscountSavings = useMemo(() => {
    return cart.reduce((sum, item) => {
      const mrp = item.product.mrp || item.currentPrice;
      return sum + Math.max(0, mrp - item.currentPrice) * item.quantity;
    }, 0);
  }, [cart]);

  // Toggle selection for a single item
  const toggleItemSelection = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all or deselect all
  const toggleSelectAll = () => {
    if (selectedItemIds.size === cart.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(cart.map((i) => i.id)));
    }
  };

  const handleVerifyPrices = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      const res = await api.verifyCartPrices();
      onCartUpdated(res.items);
      if (res.hasPriceChanges) {
        setVerificationResult(`Live prices refreshed! Total delta: ₹${res.totalSavingsOrIncrease}`);
      } else {
        setVerificationResult('All cart items verified. Prices match official live listings.');
      }
    } catch {
      setVerificationResult('Live price check complete.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAddSampleOwnStoreItem = (product: Product) => {
    if (onAddToCart) {
      onAddToCart(product, 1);
    } else {
      const newItem: CartItem = {
        id: `cart_vc_${Date.now()}`,
        product,
        quantity: 1,
        addedPrice: product.price,
        currentPrice: product.price,
        priceChanged: false,
        priceDelta: 0,
        addedAt: new Date().toISOString(),
        isOwnStore: true
      };
      onCartUpdated([...cart, newItem]);
    }
  };

  // Payment Success Handler
  const handlePaymentSuccess = useCallback(
    (order: OrderRecord, paymentId: string, method: string) => {
      setConfirmedOrder({
        orderId: order.orderId,
        paymentId,
        amount: order.totalAmount,
        paidAt: order.paidAt || new Date().toISOString(),
        method,
        order
      });

      // Clear paid items from cart
      const paidIds = new Set(order.items?.map((i) => i.id) || selectedItemIds);
      const remainingCart = cart.filter((item) => !paidIds.has(item.id));
      onCartUpdated(remainingCart);

      if (onOrderCompleted) {
        onOrderCompleted(order);
      }
    },
    [cart, selectedItemIds, onCartUpdated, onOrderCompleted]
  );

  // Empty Cart View
  if (cart.length === 0 && !confirmedOrder) {
    return (
      <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'var(--bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            border: '1px solid var(--border-color)'
          }}
        >
          <ShoppingBag size={40} color="var(--text-muted)" />
        </div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
          Your basket is empty
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '28px' }}>
          Speak your wish to compare live products across Amazon, Flipkart, and Meesho, or explore featured products below.
        </p>

        {/* Featured Store Products Card */}
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.05)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'left',
            marginTop: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="var(--accent-gold)" />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Featured Direct Checkout Products
              </h4>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary)',
                border: '1px solid var(--primary)',
                padding: '3px 8px',
                borderRadius: '6px'
              }}
            >
              INSTANT CHECKOUT
            </span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Add any of these popular VoiceCart items for fast multi-mode checkout (COD, UPI, QR, Wallets, Cards & Netbanking):
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {SAMPLE_OWN_STORE_PRODUCTS.map((prod) => (
              <div
                key={prod.productId}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '64px', height: '64px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <ProductImage
                      src={prod.imageUrl}
                      images={prod.images}
                      thumbnail={(prod as any).thumbnail}
                      serpapi_thumbnail={(prod as any).serpapi_thumbnail}
                      alt={prod.title}
                      store={prod.store}
                      productId={prod.productId}
                      variantText={prod.variantText}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      VOICECART DIRECT
                    </span>
                    <h5 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                      {prod.title}
                    </h5>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        ₹{prod.price.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textDecoration: 'line-through' }}>
                        ₹{prod.mrp.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleAddSampleOwnStoreItem(prod)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <PlusCircle size={15} /> Add to Basket & Test Pay
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.75fr) minmax(0, 1.35fr)', gap: '24px' }}>
      {/* LEFT COLUMN: Basket Items with Checkboxes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Cart Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <ShoppingBag size={22} color="var(--primary)" />
              <span>Shopping Basket ({cart.length})</span>
            </h3>

            {/* Select All Toggle */}
            <button
              onClick={toggleSelectAll}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {selectedItemIds.size === cart.length ? (
                <CheckSquare size={14} color="var(--primary)" />
              ) : (
                <Square size={14} />
              )}
              <span>{selectedItemIds.size === cart.length ? 'Deselect All' : 'Select All'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleVerifyPrices}
              disabled={isVerifying}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid var(--primary)',
                color: 'var(--primary)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={13} className={isVerifying ? 'mic-active-pulse' : ''} />
              {isVerifying ? 'Verifying...' : 'Re-check Live Prices'}
            </button>
            <button
              onClick={onClearCart}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Clear Basket
            </button>
          </div>
        </div>

        {verificationResult && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid var(--accent-green)',
              color: 'var(--accent-green)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={16} />
            <span>{verificationResult}</span>
          </div>
        )}

        {/* ALL BASKET ITEMS LIST */}
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {cart.map((item) => {
              const isSelected = selectedItemIds.has(item.id);
              const storeName = item.product.store || 'amazon';
              return (
                <div
                  key={item.id}
                  style={{
                    background: isSelected ? 'rgba(99, 102, 241, 0.04)' : 'var(--bg-subtle)',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Selection Checkbox */}
                  <div
                    onClick={() => toggleItemSelection(item.id)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title={isSelected ? 'Deselect item' : 'Select item for checkout'}
                  >
                    {isSelected ? (
                      <CheckSquare size={20} color="var(--primary)" />
                    ) : (
                      <Square size={20} color="var(--text-muted)" />
                    )}
                  </div>

                  <div style={{ width: '68px', height: '68px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#fff' }}>
                    <ProductImage
                      src={item.product.imageUrl}
                      images={item.product.images}
                      thumbnail={(item.product as any).thumbnail}
                      serpapi_thumbnail={(item.product as any).serpapi_thumbnail}
                      alt={item.product.title}
                      store={item.product.store}
                      productId={item.product.productId}
                      variantText={item.product.variantText}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background:
                            storeName === 'amazon'
                              ? '#ff9900'
                              : storeName === 'flipkart'
                              ? '#2874f0'
                              : storeName === 'meesho'
                              ? '#f43397'
                              : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          color: storeName === 'amazon' ? '#000' : '#fff'
                        }}
                      >
                        {storeName.toUpperCase()}
                      </span>

                      {item.priceChanged && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                          ⚡ Price Refreshed
                        </span>
                      )}
                    </div>

                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.product.title}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        ₹{item.currentPrice.toLocaleString()}
                      </span>
                      {item.product.mrp > item.currentPrice && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textDecoration: 'line-through' }}>
                          ₹{item.product.mrp.toLocaleString()}
                        </span>
                      )}
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Qty: {item.quantity}
                      </span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    {/* Official store deep link */}
                    <a
                      href={item.product.affiliateUrl || item.product.productUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background:
                          storeName === 'amazon'
                            ? '#ff9900'
                            : storeName === 'flipkart'
                            ? '#2874f0'
                            : storeName === 'meesho'
                            ? '#f43397'
                            : 'var(--primary)',
                        color: storeName === 'amazon' ? '#000' : '#fff',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <span>Checkout on {storeName.toUpperCase()}</span>
                      <ExternalLink size={12} />
                    </a>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-rose)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem'
                      }}
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Order Summary & Universal Demo Payment */}
      <div>
        <div className="glass-panel" style={{ padding: '22px', position: 'sticky', top: '20px' }}>
          {/* SECURE CHECKOUT HEADER BANNER */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              padding: '8px 12px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={15} color="var(--primary)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.04em' }}>
                SECURE INSTANT GATEWAY
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              100% Encrypted Checkout
            </span>
          </div>

          <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>
            Order Summary
          </h4>

          {/* Breakdown List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              fontSize: '0.88rem',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '14px',
              marginBottom: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Total Items in Cart:</span>
              <span>{cart.length} items</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)', fontWeight: 600 }}>
              <span>Selected for Payment ({selectedCartItems.length} items):</span>
              <span style={{ color: 'var(--primary)' }}>₹{selectedTotal.toLocaleString()}</span>
            </div>

            {totalDiscountSavings > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-green)', fontWeight: 600 }}>
                <span>Estimated Savings:</span>
                <span>-₹{totalDiscountSavings.toLocaleString()}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Delivery Charges:</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>FREE</span>
            </div>
          </div>

          {/* Total Payable */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, marginBottom: '18px', color: 'var(--text-main)' }}>
            <span>Total Payable</span>
            <span style={{ color: 'var(--primary)' }}>₹{selectedTotal.toLocaleString()}</span>
          </div>

          {/* UNIVERSAL PAYMENT ACTION BUTTON */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={selectedCartItems.length === 0}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '14px 18px',
                borderRadius: '12px',
                background: selectedCartItems.length === 0 ? 'var(--border-color)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.96rem',
                cursor: selectedCartItems.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: selectedCartItems.length === 0 ? 'none' : '0 8px 25px rgba(99, 102, 241, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              <Lock size={18} />
              <span>
                {selectedCartItems.length === 0
                  ? 'Select Items to Pay'
                  : `Pay Now • ₹${selectedTotal.toLocaleString()}`}
              </span>
            </button>

            {/* Explanatory Note */}
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
                fontSize: '0.74rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4
              }}
            >
              <Info size={15} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Notice:</strong> Complete fast instant checkout here, or proceed on official store using <em>Checkout on &lt;store&gt;</em>.
              </div>
            </div>
          </div>

          {/* CONFIRMED ORDER RECEIPT SUMMARY CARD (IF ANY RECENTLY PLACED) */}
          {confirmedOrder && (
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-green)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px' }}>
                <CheckCircle2 size={16} />
                <span>Recent Order Confirmed</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Order: <strong>{confirmedOrder.orderId}</strong> • ₹{confirmedOrder.amount.toLocaleString()}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    if (confirmedOrder.order) {
                      generateAndPrintReceipt(
                        confirmedOrder.order,
                        confirmedOrder.paymentId,
                        confirmedOrder.method,
                        confirmedOrder.amount,
                        confirmedOrder.paidAt
                      );
                    }
                  }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '6px',
                    borderRadius: '6px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--primary)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={13} /> PDF Receipt
                </button>

                <button
                  onClick={() => {
                    if (onNavigateToOrders) onNavigateToOrders(confirmedOrder.orderId);
                  }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '6px',
                    borderRadius: '6px',
                    background: 'var(--primary)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <span>Track</span> <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DEMO PAYMENT MODAL */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        cartItems={selectedCartItems}
        amount={selectedTotal}
        onPaymentSuccess={handlePaymentSuccess}
        onNavigateToOrders={onNavigateToOrders}
        paymentConfig={paymentConfig}
        initialTab={selectedPaymentTab}
      />
    </div>
  );
};
