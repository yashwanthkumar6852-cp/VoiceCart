import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  X,
  ShieldCheck,
  CreditCard,
  QrCode,
  Building2,
  Wallet,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  RefreshCw,
  ChevronRight,
  Smartphone,
  Copy,
  Check,
  Sparkles,
  Download,
  ArrowRight,
  Sliders,
  Info,
  CheckSquare,
  Square,
  HelpCircle,
  Zap
} from 'lucide-react';
import { CartItem, OrderRecord, PaymentConfig } from '../types';
import { api } from '../services/api';
import { generateAndPrintReceipt } from '../utils/receiptGenerator';
import { ProductImage } from './ProductImage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cartItems?: CartItem[];
  amount: number;
  onPaymentSuccess: (order: OrderRecord, paymentId: string, method: string) => void;
  onNavigateToOrders?: (orderId?: string) => void;
  paymentConfig?: PaymentConfig | null;
  initialTab?: PaymentTab;
  existingOrder?: OrderRecord | null;
  mode?: 'checkout' | 'pay_before_delivery';
}

export type PaymentTab = 'cod' | 'upi' | 'qr' | 'wallet' | 'card_netbanking';
export type CardNetbankingSubTab = 'card' | 'netbanking';
export type DemoResult = 'SUCCESS' | 'FAILED' | 'PENDING';

const POPULAR_BANKS = [
  { id: 'sbi', name: 'State Bank of India', logo: '🏛️', color: '#280071' },
  { id: 'hdfc', name: 'HDFC Bank', logo: '🏦', color: '#004c8f' },
  { id: 'icici', name: 'ICICI Bank', logo: '🏢', color: '#b02a30' },
  { id: 'axis', name: 'Axis Bank', logo: '💼', color: '#97144d' },
  { id: 'kotak', name: 'Kotak Mahindra Bank', logo: '🏷️', color: '#ed1c24' },
  { id: 'canara', name: 'Canara Bank', logo: '🏬', color: '#007cb0' },
  { id: 'bob', name: 'Bank of Baroda', logo: '🏤', color: '#f26522' }
];

const POPULAR_WALLETS = [
  { id: 'paytm', name: 'Paytm Wallet', balance: 4500, logo: '💙' },
  { id: 'phonepe', name: 'PhonePe Wallet', balance: 3200, logo: '💜' },
  { id: 'amazonpay', name: 'Amazon Pay Balance', balance: 5000, logo: '🟠' },
  { id: 'mobikwik', name: 'MobiKwik Wallet', balance: 2100, logo: '🔷' },
  { id: 'freecharge', name: 'Freecharge Balance', balance: 1800, logo: '⚡' }
];

export const PaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  cartItems = [],
  amount,
  onPaymentSuccess,
  onNavigateToOrders,
  paymentConfig,
  initialTab = 'upi',
  existingOrder = null,
  mode = 'checkout'
}) => {
  const isPayBeforeDelivery = mode === 'pay_before_delivery' || Boolean(existingOrder);
  const effectiveAmount = existingOrder ? existingOrder.totalAmount : amount;
  const displayItems = useMemo(() => {
    if (cartItems && cartItems.length > 0) return cartItems;
    if (existingOrder?.items && existingOrder.items.length > 0) {
      return existingOrder.items.map((it: any) => ({
        id: it.id || it.productId,
        product: {
          id: it.productId,
          productId: it.productId,
          title: it.name || it.title,
          price: it.price,
          imageUrl: it.image || it.imageUrl,
          store: it.store
        },
        quantity: it.quantity,
        currentPrice: it.price
      }));
    }
    return [];
  }, [cartItems, existingOrder]);
  const [activeTab, setActiveTab] = useState<PaymentTab>(initialTab === 'cod' && isPayBeforeDelivery ? 'upi' : initialTab);
  const [cardSubTab, setCardSubTab] = useState<CardNetbankingSubTab>('card');
  const [demoOrder, setDemoOrder] = useState<any>(null);
  const [internalOrderId, setInternalOrderId] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);

  // Demo Control Panel States
  const [demoResult, setDemoResult] = useState<DemoResult>('SUCCESS');
  const [processingDelay, setProcessingDelay] = useState<number>(1.5);
  const [showDemoControls, setShowDemoControls] = useState(false);

  // Processing & View States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [paymentView, setPaymentView] = useState<'checkout' | 'success' | 'failure' | 'pending' | 'cod_pending'>('checkout');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [completedPayment, setCompletedPayment] = useState<{
    orderId: string;
    paymentId: string;
    method: string;
    amount: number;
    paidAt: string;
    order?: OrderRecord;
  } | null>(null);

  // 1. UPI State
  const [upiIdInput, setUpiIdInput] = useState('');
  const [verifiedUpiName, setVerifiedUpiName] = useState<string | null>(null);
  const [upiVerificationError, setUpiVerificationError] = useState<string>('');
  const [activeUpiAppModal, setActiveUpiAppModal] = useState<string | null>(null);
  const [enteredPin, setEnteredPin] = useState('');

  // 2. QR Code State
  const [upiQrUrl, setUpiQrUrl] = useState<string>('');
  const [qrCountdown, setQrCountdown] = useState<number>(300); // 5 minutes
  const [copiedUpi, setCopiedUpi] = useState(false);

  // 3. Wallet State
  const [selectedWallet, setSelectedWallet] = useState(POPULAR_WALLETS[0].id);
  const [showWalletOtpModal, setShowWalletOtpModal] = useState(false);
  const [walletOtp, setWalletOtp] = useState('');
  const [walletOtpError, setWalletOtpError] = useState('');

  // 4. Card State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('VoiceCart User');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [saveCardDemo, setSaveCardDemo] = useState(false);
  const [showCardOtpModal, setShowCardOtpModal] = useState(false);
  const [cardOtp, setCardOtp] = useState('');
  const [cardOtpAttemptsLeft, setCardOtpAttemptsLeft] = useState(3);
  const [cardOtpError, setCardOtpError] = useState('');

  // 5. Netbanking State
  const [selectedBank, setSelectedBank] = useState(POPULAR_BANKS[0].id);
  const [showBankLoginModal, setShowBankLoginModal] = useState(false);
  const [bankUserId, setBankUserId] = useState('user_101');
  const [bankPassword, setBankPassword] = useState('••••••••');

  const wasOpenRef = useRef(false);

  // Reset & initialize when modal opens
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setIsInitializing(true);
      setPaymentView('checkout');
      setErrorMessage('');
      setEnteredPin('');
      setCardOtp('');
      setWalletOtp('');
      setCardOtpAttemptsLeft(3);
      setQrCountdown(300);
      setVerifiedUpiName(null);
      setUpiVerificationError('');
      if (initialTab) {
        setActiveTab(initialTab === 'cod' && isPayBeforeDelivery ? 'upi' : initialTab);
      } else if (isPayBeforeDelivery) {
        setActiveTab('upi');
      }

      if (existingOrder) {
        setDemoOrder({
          id: existingOrder.paymentOrderId || existingOrder.id,
          amount: Math.round(effectiveAmount * 100),
          currency: 'INR'
        });
        setInternalOrderId(existingOrder.orderId);
        setIsInitializing(false);
      } else {
        api.createDemoOrder({
          items: cartItems,
          notes: { platform: 'VoiceCart Instant Gateway' }
        })
          .then((res) => {
            if (res.success && res.order) {
              setDemoOrder(res.order);
              setInternalOrderId(res.internalOrderId);
            }
          })
          .catch((err) => {
            console.warn('Order creation warning:', err);
            const fallbackId = `order_${Date.now().toString().slice(-6)}`;
            setDemoOrder({ id: fallbackId, amount: amount * 100, currency: 'INR' });
            setInternalOrderId(`VC-ORD-${Date.now().toString().slice(-6)}`);
          })
          .finally(() => {
            setIsInitializing(false);
          });
      }
    } else if (!isOpen) {
      wasOpenRef.current = false;
    }
  }, [isOpen, cartItems, amount, initialTab, existingOrder, isPayBeforeDelivery, effectiveAmount]);

  // QR Countdown timer - cleanly manages interval without recreating every second
  useEffect(() => {
    let timer: any = null;
    if (isOpen && activeTab === 'qr') {
      timer = setInterval(() => {
        setQrCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, activeTab]);

  const formattedCountdown = useMemo(() => {
    const minutes = Math.floor(qrCountdown / 60);
    const seconds = qrCountdown % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [qrCountdown]);

  const orderDisplayId = internalOrderId || demoOrder?.id || `VC-ORDER`;
  const merchantUpiId = paymentConfig?.upiId || '8660318787@ibl';
  const merchantName = paymentConfig?.upiPayeeName || 'VoiceCart';

  // Dynamic UPI URI with pre-filled total amount and transaction references
  const demoUpiUri = useMemo(() => {
    const safeAmount = Number(effectiveAmount) || Number(amount) || 0;
    const formattedAmount = safeAmount.toFixed(2);
    const sanitizedOrderId = String(orderDisplayId || 'VC-ORD').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
    const sanitizedNote = encodeURIComponent(`VoiceCart Order ${sanitizedOrderId}`.slice(0, 45));
    // NPCI standard UPI format with pa, pn, am, cu, tn, tr to directly prefill amount on scan
    return `upi://pay?pa=${merchantUpiId}&pn=${encodeURIComponent(merchantName)}&am=${formattedAmount}&cu=INR&tn=${sanitizedNote}&tr=${encodeURIComponent(sanitizedOrderId)}`;
  }, [merchantUpiId, merchantName, effectiveAmount, amount, orderDisplayId]);

  // Generate live high-resolution dynamic QR code for UPI with amount pre-filled
  useEffect(() => {
    if (isOpen && demoUpiUri) {
      QRCode.toDataURL(demoUpiUri, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#0f172a', light: '#ffffff' }
      })
        .then((url) => setUpiQrUrl(url))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [isOpen, demoUpiUri]);

  // Luhn Algorithm Card validation helper
  const isLuhnValid = useMemo(() => {
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.length < 13 || clean.length > 19) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = clean.length - 1; i >= 0; i--) {
      let digit = parseInt(clean.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }, [cardNumber]);

  const cardBrand = useMemo(() => {
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.startsWith('4')) return { brand: 'Visa', color: '#1a1f71', label: 'VISA' };
    if (/^5[1-5]/.test(clean)) return { brand: 'Mastercard', color: '#eb001b', label: 'MASTERCARD' };
    if (/^(60|65|81|82)/.test(clean)) return { brand: 'RuPay', color: '#097939', label: 'RUPAY' };
    if (/^3[47]/.test(clean)) return { brand: 'Amex', color: '#007bc1', label: 'AMEX' };
    return { brand: 'Card', color: '#6366f1', label: 'CARD' };
  }, [cardNumber]);

  // Format Card input with spaces
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 16);
    const spaced = digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(spaced);
  };

  // Format Expiry MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let clean = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) {
      clean = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    setCardExpiry(clean);
  };

  const isExpiryValid = useMemo(() => {
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) return false;
    const [monthStr, yearStr] = cardExpiry.split('/');
    const month = parseInt(monthStr, 10);
    const year = 2000 + parseInt(yearStr, 10);
    if (month < 1 || month > 12) return false;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;
    return true;
  }, [cardExpiry]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(merchantUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleVerifyUpiId = () => {
    setUpiVerificationError('');
    setVerifiedUpiName(null);
    const trimmed = upiIdInput.trim();
    if (!/^[\w.-]+@[\w.-]+$/.test(trimmed)) {
      setUpiVerificationError('Please enter a valid UPI ID in username@bank format (e.g. user@okhdfcbank)');
      return;
    }
    setVerifiedUpiName(`${trimmed.split('@')[0].toUpperCase()} (Verified Payee)`);
  };

  // Execution engine: processes payment with progressive animation
  const executePayment = async (
    methodCode: 'cod' | 'upi' | 'qr' | 'wallet' | 'card' | 'netbanking',
    methodLabel: string,
    overrideResult?: DemoResult,
    failureText?: string
  ) => {
    const resultToUse = overrideResult || demoResult;
    setIsProcessing(true);
    setErrorMessage('');

    setProcessingStep('1/3: Contacting payment authorization network...');
    await new Promise((r) => setTimeout(r, Math.max(300, (processingDelay * 1000) / 3)));

    setProcessingStep('2/3: Verifying authorization & fraud checks...');
    await new Promise((r) => setTimeout(r, Math.max(400, (processingDelay * 1000) / 3)));

    setProcessingStep('3/3: Finalizing order transaction on VoiceCart server...');
    await new Promise((r) => setTimeout(r, Math.max(300, (processingDelay * 1000) / 3)));

    try {
      let confirmation: any;
      if (isPayBeforeDelivery && existingOrder) {
        confirmation = await api.payBeforeDelivery({
          orderId: existingOrder.orderId || existingOrder.id,
          method: methodCode,
          demoResult: resultToUse,
          failureReason: failureText || (resultToUse === 'FAILED' ? 'Payment declined by bank switch' : undefined)
        });
      } else {
        confirmation = await api.confirmDemoPayment({
          orderId: demoOrder?.id || internalOrderId,
          method: methodCode,
          demoResult: resultToUse,
          failureReason: failureText || (resultToUse === 'FAILED' ? 'Payment declined by bank switch' : undefined)
        });
      }

      setIsProcessing(false);

      if (confirmation.success) {
        const confirmedOrderId = confirmation.orderId || existingOrder?.orderId || demoOrder?.id || internalOrderId || `order_${Date.now()}`;
        const confirmedPaymentId = confirmation.paymentId || `pay_${Date.now()}`;
        const confirmedMethod = confirmation.method || methodCode;
        const confirmedPaidAt = confirmation.paidAt || (methodCode === 'cod' ? '' : new Date().toISOString());

        setCompletedPayment({
          orderId: confirmedOrderId,
          paymentId: confirmedPaymentId,
          method: confirmedMethod,
          amount: confirmation.amount || effectiveAmount,
          paidAt: confirmedPaidAt,
          order: confirmation.order
        });

        const isCodOrder =
          Boolean(confirmation.isCodPending) ||
          confirmation.status === 'COD_PENDING' ||
          confirmation.status === 'cod_pending' ||
          methodCode === 'cod' ||
          (confirmation.method || '').toLowerCase().includes('cod');

        if (confirmation.isPaid || isPayBeforeDelivery) {
          setPaymentView('success');
          if (confirmation.order) onPaymentSuccess(confirmation.order, confirmedPaymentId, confirmedMethod);
        } else if (isCodOrder) {
          setPaymentView('cod_pending');
          if (confirmation.order) onPaymentSuccess(confirmation.order, confirmedPaymentId, confirmedMethod);
        } else if (confirmation.isPending) {
          setPaymentView('pending');
        } else {
          setPaymentView('failure');
          setErrorMessage(confirmation.message || 'Payment simulation failed.');
        }
      } else {
        setPaymentView('failure');
        setErrorMessage(confirmation.error || 'Payment confirmation failed.');
      }
    } catch (err: any) {
      setIsProcessing(false);
      setPaymentView('failure');
      setErrorMessage(err.message || 'Server connection error during checkout.');
    }
  };

  // Status Poller for Pending view
  useEffect(() => {
    let interval: any = null;
    if (paymentView === 'pending' && completedPayment) {
      interval = setInterval(async () => {
        try {
          const res = await api.pollOrderStatus(completedPayment.orderId);
          if (res.isPaid && res.order) {
            clearInterval(interval);
            setPaymentView('success');
            onPaymentSuccess(res.order, completedPayment.paymentId, completedPayment.method);
          }
        } catch {
          // keep polling
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [paymentView, completedPayment, onPaymentSuccess]);

  // Sub-Flow Handlers
  const handleUpiAppSubmit = (appName: string) => {
    setActiveUpiAppModal(appName);
  };

  const handlePinSubmit = () => {
    if (enteredPin.length < 4) return;
    const app = activeUpiAppModal || 'UPI App';
    setActiveUpiAppModal(null);
    executePayment('upi', `UPI (${app})`);
  };

  const handleCardFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLuhnValid || !isExpiryValid || cardCvv.length < 3) {
      return;
    }
    const cleanNum = cardNumber.replace(/\D/g, '');
    if (cleanNum === '4000000000000002') {
      executePayment('card', `Card (${cardBrand.brand})`, 'FAILED', 'Bank declined transaction');
      return;
    }
    setShowCardOtpModal(true);
    setCardOtp('');
    setCardOtpError('');
  };

  const handleCardOtpVerify = () => {
    if (cardOtp === '123456') {
      setShowCardOtpModal(false);
      executePayment('card', `Card (${cardBrand.brand} •••• ${cardNumber.slice(-4)})`);
    } else {
      const remaining = cardOtpAttemptsLeft - 1;
      setCardOtpAttemptsLeft(remaining);
      if (remaining <= 0) {
        setShowCardOtpModal(false);
        executePayment('card', `Card (${cardBrand.brand})`, 'FAILED', '3D Secure OTP verification failed (3 invalid attempts)');
      } else {
        setCardOtpError(`Invalid OTP. Enter "123456". ${remaining} attempts left.`);
      }
    }
  };

  const handleWalletSubmit = () => {
    const current = POPULAR_WALLETS.find((w) => w.id === selectedWallet);
    if (demoResult === 'FAILED') {
      executePayment('wallet', `Wallet (${current?.name})`, 'FAILED', `Insufficient balance in ${current?.name}`);
      return;
    }
    setShowWalletOtpModal(true);
    setWalletOtp('');
    setWalletOtpError('');
  };

  const handleWalletOtpVerify = () => {
    if (walletOtp === '123456') {
      setShowWalletOtpModal(false);
      const current = POPULAR_WALLETS.find((w) => w.id === selectedWallet);
      executePayment('wallet', `Wallet (${current?.name})`);
    } else {
      setWalletOtpError('Invalid OTP. Use OTP 123456.');
    }
  };

  const handleBankLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowBankLoginModal(false);
    const bank = POPULAR_BANKS.find((b) => b.id === selectedBank);
    executePayment('netbanking', `Netbanking (${bank?.name})`);
  };

  const handleCodConfirm = () => {
    executePayment('cod', 'Cash on Delivery (COD)');
  };

  if (!isOpen) return null;

  return (
    <div
      className="payment-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel payment-modal-card"
        style={{
          maxWidth: '880px',
          width: '100%',
          borderRadius: '18px',
          padding: '0',
          overflow: 'hidden',
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          position: 'relative',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BANNER */}
        <div
          className="payment-top-banner"
          style={{
            background: 'linear-gradient(90deg, #4f46e5, #06b6d4)',
            color: '#fff',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
            fontWeight: 700,
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
            <Sparkles size={16} style={{ flexShrink: 0 }} />
            <span
              className="payment-modal-desktop-title"
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              VOICECART FAST SECURE CHECKOUT — 256-Bit Encrypted Payment
            </span>
            <span
              className="payment-modal-mobile-title"
              style={{
                display: 'none',
                whiteSpace: 'nowrap',
                fontWeight: 800
              }}
            >
              Secure Checkout
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setShowDemoControls(!showDemoControls)}
              style={{
                background: showDemoControls ? '#fff' : 'rgba(255, 255, 255, 0.2)',
                color: showDemoControls ? '#4f46e5' : '#fff',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Sliders size={13} style={{ flexShrink: 0 }} />
              <span className="payment-demo-btn-text">Simulation Controls</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(0,0,0,0.2)',
                border: 'none',
                color: '#fff',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* DEMO CONTROLS DRAWER */}
        {showDemoControls && (
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              borderBottom: '1px solid rgba(99, 102, 241, 0.3)',
              padding: '12px 18px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              fontSize: '0.8rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Simulate Result:</span>
              {(['SUCCESS', 'FAILED', 'PENDING'] as DemoResult[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setDemoResult(r)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: demoResult === r ? '2px solid #6366f1' : '1px solid var(--border-color)',
                    background:
                      demoResult === r
                        ? r === 'SUCCESS'
                          ? '#059669'
                          : r === 'FAILED'
                          ? '#dc2626'
                          : '#d97706'
                        : 'var(--bg-subtle)',
                    color: demoResult === r ? '#fff' : 'var(--text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Delay: {processingDelay}s</span>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={processingDelay}
                onChange={(e) => setProcessingDelay(parseFloat(e.target.value))}
                style={{ width: '90px', cursor: 'pointer' }}
              />
            </div>
          </div>
        )}

        {/* MAIN BODY */}
        <div className="payment-modal-split">
          {/* LEFT PAYMENT AREA */}
          <div className="payment-modal-left-area">
            {/* VIEW 1: CHECKOUT TABS */}
            {paymentView === 'checkout' && !isProcessing && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <Lock size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
                      <span>{isPayBeforeDelivery ? 'Pay Online Before Delivery' : 'Select Payment Option'}</span>
                    </h3>
                    <div style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid var(--primary)', padding: '3px 10px', borderRadius: '20px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.82rem', flexShrink: 0 }}>
                      Due: ₹{effectiveAmount.toLocaleString()}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.35 }}>
                    {isPayBeforeDelivery
                      ? 'Pay online now to convert your COD order into a pre-paid delivery. Zero cash due on arrival.'
                      : 'Choose any of the 5 payment methods below to complete your checkout.'}
                  </p>
                </div>

                {/* 5 MAIN TABS */}
                <div className="payment-main-tabs-grid">
                  {[
                    ...(isPayBeforeDelivery ? [] : [{ id: 'cod', label: 'COD', mobileLabel: 'COD', icon: Truck }]),
                    { id: 'upi', label: 'UPI', mobileLabel: 'UPI', icon: Smartphone },
                    { id: 'qr', label: 'QR Code', mobileLabel: 'QR Code', icon: QrCode },
                    { id: 'wallet', label: 'Wallets', mobileLabel: 'Wallets', icon: Wallet },
                    { id: 'card_netbanking', label: 'Cards & Banks', mobileLabel: 'Cards', icon: CreditCard }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as PaymentTab)}
                        style={{
                          border: isActive ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                          background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-subtle)',
                          color: isActive ? 'var(--primary)' : 'var(--text-main)',
                          fontWeight: isActive ? 700 : 500
                        }}
                      >
                        <Icon size={18} style={{ flexShrink: 0 }} />
                        <span className="tab-desktop-label">{tab.label}</span>
                        <span className="tab-mobile-label">{tab.mobileLabel}</span>
                      </button>
                    );
                  })}
                </div>

                {/* TAB 1: CASH ON DELIVERY (COD) */}
                {activeTab === 'cod' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div
                      style={{
                        padding: '18px',
                        borderRadius: '12px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-green)', fontWeight: 700, marginBottom: '6px' }}>
                        <Truck size={20} />
                        <span>Pay when the order arrives</span>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                        Place order now with zero advance payment. You can pay with cash or UPI to the delivery courier when your package arrives.
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>COD Handling Fee:</span>
                        <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>₹0 (FREE)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', marginTop: '4px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Total Payable at Doorstep:</span>
                        <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>₹{amount.toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleCodConfirm}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.96rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <CheckCircle2 size={18} />
                      <span>Place Order (Cash on Delivery)</span>
                    </button>
                  </div>
                )}

                {/* TAB 2: UPI (UPI ID + APP BUTTONS) */}
                {activeTab === 'upi' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {/* UPI Apps Row */}
                    <div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                        Instant Pay via Simulated UPI Apps:
                      </span>
                      <div className="payment-upi-apps-grid">
                        {[
                          { id: 'gpay', name: 'Google Pay', icon: '🟢', color: '#1a73e8' },
                          { id: 'phonepe', name: 'PhonePe', icon: '🟣', color: '#5f259f' },
                          { id: 'paytm', name: 'Paytm', icon: '🔵', color: '#00b9f5' },
                          { id: 'other', name: 'Other UPI', icon: '⚡', color: '#6366f1' }
                        ].map((app) => (
                          <button
                            key={app.id}
                            onClick={() => handleUpiAppSubmit(app.name)}
                            style={{
                              padding: '12px 6px',
                              borderRadius: '10px',
                              background: 'var(--bg-subtle)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-main)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            <span style={{ fontSize: '1.2rem' }}>{app.icon}</span>
                            <span>{app.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                      <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                      <span>OR ENTER VIRTUAL UPI ID</span>
                      <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                    </div>

                    {/* UPI ID Field with Format Validation & Verify Button */}
                    <div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={upiIdInput}
                          onChange={(e) => setUpiIdInput(e.target.value)}
                          placeholder="e.g. yourname@okhdfcbank"
                          className="glass-input"
                          style={{ flex: 1, padding: '12px', fontSize: '0.88rem' }}
                        />
                        <button
                          onClick={handleVerifyUpiId}
                          style={{
                            padding: '0 16px',
                            borderRadius: '10px',
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--primary)',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer'
                          }}
                        >
                          Verify
                        </button>
                      </div>

                      {upiVerificationError && (
                        <span style={{ color: '#ef4444', fontSize: '0.76rem', marginTop: '6px', display: 'block' }}>
                          {upiVerificationError}
                        </span>
                      )}

                      {verifiedUpiName && (
                        <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={15} />
                          <span>{verifiedUpiName}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (!upiIdInput.trim()) {
                          setUpiVerificationError('Please enter a UPI ID first.');
                          return;
                        }
                        handleUpiAppSubmit(`UPI ID: ${upiIdInput}`);
                      }}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.94rem',
                        cursor: 'pointer'
                      }}
                    >
                      Request Payment of ₹{effectiveAmount.toLocaleString()}
                    </button>
                  </div>
                )}

                {/* TAB 3: DEDICATED QR CODE WITH 5-MIN COUNTDOWN & SIMULATE SCAN */}
                {activeTab === 'qr' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                      <Clock size={14} />
                      <span>QR code expires in: {formattedCountdown}</span>
                    </div>

                    {/* Official VoiceCart Dynamic UPI QR Container */}
                    <div
                      style={{
                        position: 'relative',
                        maxWidth: '250px',
                        width: '100%',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 16px 36px -8px rgba(0, 0, 0, 0.4)',
                        border: '2px solid rgba(99, 102, 241, 0.25)',
                        background: '#ffffff',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                    >
                      {upiQrUrl ? (
                        <img
                          src={upiQrUrl}
                          alt={`VoiceCart UPI QR - Pre-filled ₹${effectiveAmount.toLocaleString()}`}
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                            borderRadius: '14px'
                          }}
                        />
                      ) : (
                        <img
                          src="/voicecart-qr.png"
                          alt="VoiceCart UPI QR"
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                            borderRadius: '14px'
                          }}
                        />
                      )}

                      <div
                        style={{
                          marginTop: '8px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: 'rgba(99, 102, 241, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#4338ca', letterSpacing: '0.4px' }}>
                          VOICECART PAY • UPI DYNAMIC
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          ₹{effectiveAmount.toLocaleString()}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: 700
                          }}
                        >
                          Verified Merchant
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.76rem', fontWeight: 600 }}>
                        <CheckCircle2 size={13} color="#10b981" />
                        <span>Amount directly pre-filled when scanned</span>
                      </div>

                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Payee UPI ID: <strong style={{ color: 'var(--text-main)', letterSpacing: '0.3px' }}>{merchantUpiId}</strong>
                      </span>
                    </div>

                    <div className="payment-qr-actions-row" style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '380px' }}>
                      <button
                        onClick={handleCopyUpi}
                        style={{
                          flex: 1,
                          padding: '11px',
                          borderRadius: '10px',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-color)',
                          color: copiedUpi ? '#10b981' : 'var(--text-main)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {copiedUpi ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                        <span>{copiedUpi ? `Copied ${merchantUpiId}!` : 'Copy UPI ID'}</span>
                      </button>

                      <button
                        onClick={() => executePayment('qr', `VoiceCart UPI (${merchantUpiId})`)}
                        style={{
                          flex: 1.3,
                          padding: '11px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                          border: 'none',
                          color: '#fff',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
                        }}
                      >
                        <Zap size={15} />
                        <span>Simulate Scan & Pay</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 4: WALLETS (Paytm, PhonePe, Amazon Pay, Mobikwik, Freecharge) */}
                {activeTab === 'wallet' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Select Digital Wallet:
                    </span>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {POPULAR_WALLETS.map((w) => {
                        const isSelected = selectedWallet === w.id;
                        return (
                          <div
                            key={w.id}
                            onClick={() => setSelectedWallet(w.id)}
                            style={{
                              padding: '12px 14px',
                              borderRadius: '10px',
                              background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-subtle)',
                              border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '1.2rem' }}>{w.logo}</span>
                              <div>
                                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', display: 'block' }}>
                                  {w.name}
                                </span>
                                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                  Available Balance: ₹{w.balance.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                border: isSelected ? '5px solid var(--primary)' : '2px solid var(--border-color)',
                                background: '#fff'
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleWalletSubmit}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.94rem',
                        cursor: 'pointer'
                      }}
                    >
                      Pay ₹{effectiveAmount.toLocaleString()} from Wallet
                    </button>
                  </div>
                )}

                {/* TAB 5: CARDS & NETBANKING (One tab with two sub-tabs) */}
                {activeTab === 'card_netbanking' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Sub-tab switcher */}
                    <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <button
                        onClick={() => setCardSubTab('card')}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '8px',
                          border: 'none',
                          background: cardSubTab === 'card' ? 'var(--primary)' : 'transparent',
                          color: cardSubTab === 'card' ? '#fff' : 'var(--text-secondary)',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer'
                        }}
                      >
                        💳 Credit / Debit Card
                      </button>
                      <button
                        onClick={() => setCardSubTab('netbanking')}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '8px',
                          border: 'none',
                          background: cardSubTab === 'netbanking' ? 'var(--primary)' : 'transparent',
                          color: cardSubTab === 'netbanking' ? '#fff' : 'var(--text-secondary)',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer'
                        }}
                      >
                        🏦 Netbanking (All Banks)
                      </button>
                    </div>

                    {/* SUB-TAB A: CARD FORM */}
                    {cardSubTab === 'card' && (
                      <form onSubmit={handleCardFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                              Card Number (Luhn Check)
                            </label>
                            <span style={{ fontSize: '0.72rem', color: cardBrand.color, fontWeight: 800 }}>
                              {cardBrand.label}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            placeholder="4111 1111 1111 1111"
                            className="glass-input"
                            style={{
                              width: '100%',
                              padding: '12px',
                              fontSize: '0.95rem',
                              letterSpacing: '1px',
                              border: cardNumber.length >= 13 ? (isLuhnValid ? '1px solid #10b981' : '1px solid #ef4444') : '1px solid var(--border-color)'
                            }}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            placeholder="Name on Card"
                            className="glass-input"
                            style={{ width: '100%', padding: '12px', fontSize: '0.88rem' }}
                            required
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                              Expiry (MM/YY)
                            </label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={handleExpiryChange}
                              placeholder="MM/YY"
                              className="glass-input"
                              style={{
                                width: '100%',
                                padding: '12px',
                                fontSize: '0.88rem',
                                border: cardExpiry.length === 5 ? (isExpiryValid ? '1px solid #10b981' : '1px solid #ef4444') : '1px solid var(--border-color)'
                              }}
                              required
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                              CVV (3-4 Digits)
                            </label>
                            <input
                              type="password"
                              maxLength={4}
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                              placeholder="•••"
                              className="glass-input"
                              style={{ width: '100%', padding: '12px', fontSize: '0.88rem' }}
                              required
                            />
                          </div>
                        </div>

                        {/* Save Card Checkbox */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={saveCardDemo}
                            onChange={(e) => setSaveCardDemo(e.target.checked)}
                          />
                          <span>Save card securely for faster checkout</span>
                        </label>

                        <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-subtle)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          💡 <strong>Test Cards:</strong> Use <code>4111 1111 1111 1111</code> for success or <code>4000 0000 0000 0002</code> for simulated decline.
                        </div>

                        <button
                          type="submit"
                          disabled={!isLuhnValid || !isExpiryValid || cardCvv.length < 3}
                          style={{
                            padding: '14px',
                            borderRadius: '12px',
                            background: !isLuhnValid || !isExpiryValid || cardCvv.length < 3 ? 'var(--border-color)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            border: 'none',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.94rem',
                            cursor: !isLuhnValid || !isExpiryValid || cardCvv.length < 3 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Pay ₹{effectiveAmount.toLocaleString()} via Card
                        </button>
                      </form>
                    )}

                    {/* SUB-TAB B: NETBANKING */}
                    {cardSubTab === 'netbanking' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          Select Popular Bank:
                        </span>

                        <div className="payment-banks-grid">
                          {POPULAR_BANKS.map((b) => {
                            const isSelected = selectedBank === b.id;
                            return (
                              <button
                                key={b.id}
                                onClick={() => setSelectedBank(b.id)}
                                style={{
                                  padding: '12px 10px',
                                  borderRadius: '10px',
                                  background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-subtle)',
                                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  color: 'var(--text-main)',
                                  fontSize: '0.8rem',
                                  fontWeight: isSelected ? 700 : 500,
                                  cursor: 'pointer',
                                  textAlign: 'left'
                                }}
                              >
                                <span style={{ fontSize: '1.2rem' }}>{b.logo}</span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {b.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => setShowBankLoginModal(true)}
                          style={{
                            padding: '14px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            border: 'none',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.94rem',
                            cursor: 'pointer'
                          }}
                        >
                          Proceed with {POPULAR_BANKS.find((b) => b.id === selectedBank)?.name}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* VIEW 2: PROCESSING ANIMATION */}
            {isProcessing && (
              <div style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    border: '4px solid rgba(99, 102, 241, 0.2)',
                    borderTopColor: '#6366f1',
                    animation: 'spin 1s linear infinite'
                  }}
                />
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Processing Payment...
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '320px', lineHeight: 1.4 }}>
                  {processingStep}
                </p>
              </div>
            )}

            {/* VIEW 3: SUCCESS RESULT */}
            {paymentView === 'success' && completedPayment && (
              <div style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '2px solid #10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Check size={36} color="#10b981" />
                </div>

                <div>
                  <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginBottom: '4px' }}>
                    Payment Successful!
                  </h4>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {isPayBeforeDelivery
                      ? 'Payment successful! Your order will be delivered as scheduled.'
                      : 'Transaction authorized and confirmed successfully.'}
                  </span>
                </div>

                <div
                  style={{
                    width: '100%',
                    background: 'var(--bg-subtle)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Order ID:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{completedPayment.orderId}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Payment ID:</span>
                    <strong style={{ color: 'var(--primary)' }}>{completedPayment.paymentId}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Method:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{completedPayment.method}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Amount Paid:</span>
                    <strong style={{ color: 'var(--accent-green)' }}>₹{completedPayment.amount.toLocaleString()}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <button
                    onClick={() => {
                      if (completedPayment.order) {
                        generateAndPrintReceipt(
                          completedPayment.order,
                          completedPayment.paymentId,
                          completedPayment.method,
                          completedPayment.amount,
                          completedPayment.paidAt
                        );
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--primary)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Download size={15} />
                    <span>Download Receipt (PDF)</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      if (onNavigateToOrders) onNavigateToOrders();
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>Track Order</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 4: COD PENDING RESULT */}
            {paymentView === 'cod_pending' && completedPayment && (
              <div style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '2px solid #10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Truck size={34} color="#10b981" />
                </div>

                <div>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                    Order Placed (Pending COD Payment)
                  </h4>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Your order is confirmed. Pay ₹{completedPayment.amount.toLocaleString()} when the courier delivers your package.
                  </span>
                </div>

                <div
                  style={{
                    width: '100%',
                    background: 'var(--bg-subtle)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Order ID:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{completedPayment.orderId}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                    <strong style={{ color: '#d97706' }}>Pending payment (COD)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Payable Amount:</span>
                    <strong style={{ color: 'var(--text-main)' }}>₹{completedPayment.amount.toLocaleString()}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <button
                    onClick={() => {
                      if (completedPayment.order) {
                        generateAndPrintReceipt(
                          completedPayment.order,
                          completedPayment.paymentId,
                          completedPayment.method,
                          completedPayment.amount,
                          completedPayment.paidAt
                        );
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--primary)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Download size={15} />
                    <span>Download Invoice</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      if (onNavigateToOrders) onNavigateToOrders(completedPayment?.orderId);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>Track Order</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 5: FAILURE RESULT */}
            {paymentView === 'failure' && (
              <div style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '2px solid #ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <AlertTriangle size={34} color="#ef4444" />
                </div>

                <div>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ef4444', marginBottom: '4px' }}>
                    Payment Declined
                  </h4>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {errorMessage || 'Payment declined by bank switch.'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '10px' }}>
                  <button
                    onClick={() => setPaymentView('checkout')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                  >
                    Try Another Method
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 6: PENDING POLLER */}
            {paymentView === 'pending' && (
              <div style={{ padding: '30px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(234, 179, 8, 0.15)',
                    border: '2px solid #f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Clock size={32} color="#f59e0b" />
                </div>

                <div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b', marginBottom: '4px' }}>
                    Payment Pending Authorization
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Waiting for approval confirmation from the simulated bank switch. Auto-refreshing status every 3 seconds...
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600 }}>
                  <RefreshCw size={16} className="mic-active-pulse" />
                  <span>Polling order status...</span>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT ORDER BREAKDOWN & SECURITY */}
          <div className="payment-modal-right-area">
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
                Order Summary
              </h4>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
                {displayItems.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#fff' }}>
                      <ProductImage
                        src={item.product?.imageUrl}
                        images={item.product?.images}
                        thumbnail={(item.product as any)?.thumbnail}
                        serpapi_thumbnail={(item.product as any)?.serpapi_thumbnail}
                        alt={item.product?.title || 'Product'}
                        store={item.product?.store}
                        productId={item.product?.productId}
                        variantText={item.product?.variantText}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.product?.title || 'Product'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Qty: {item.quantity} • ₹{item.currentPrice?.toLocaleString() || item.price?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculations */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Items Subtotal:</span>
                  <span>₹{effectiveAmount.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Delivery Charges:</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>FREE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Estimated Taxes:</span>
                  <span>₹0.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', paddingTop: '8px', borderTop: '1px dashed var(--border-color)' }}>
                  <span>Total Payable:</span>
                  <span style={{ color: 'var(--primary)' }}>₹{effectiveAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Security Seals */}
            <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-green)', fontSize: '0.74rem', fontWeight: 700 }}>
                <ShieldCheck size={16} />
                <span>100% Encrypted & Safe Checkout</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                Multi-layer tokenization with instant merchant clearance.
              </span>
            </div>
          </div>
        </div>

        {/* MODAL OVERLAY 1: SIMULATED UPI APP WITH NUMERIC PIN PAD */}
        {activeUpiAppModal && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              zIndex: 100
            }}
          >
            <div
              style={{
                background: 'var(--bg-card, #1e293b)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '24px',
                width: '100%',
                maxWidth: '340px',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📱</div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                {activeUpiAppModal}
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Approve payment of <strong>₹{effectiveAmount.toLocaleString()}</strong> to {merchantName}
              </p>

              {/* PIN DISPLAY */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '18px'
                }}
              >
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      background: i < enteredPin.length ? 'var(--primary)' : 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)'
                    }}
                  />
                ))}
              </div>

              {/* PIN PAD */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      if (k === 'C') setEnteredPin('');
                      else if (k === '⌫') setEnteredPin((p) => p.slice(0, -1));
                      else if (enteredPin.length < 6) setEnteredPin((p) => p + k);
                    }}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      fontSize: '1rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setActiveUpiAppModal(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={enteredPin.length < 4}
                  onClick={handlePinSubmit}
                  style={{
                    flex: 1.5,
                    padding: '10px',
                    borderRadius: '8px',
                    background: enteredPin.length < 4 ? 'var(--border-color)' : 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: enteredPin.length < 4 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Authorize PIN
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL OVERLAY 2: 3D SECURE CARD OTP SCREEN */}
        {showCardOtpModal && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              zIndex: 100
            }}
          >
            <div
              style={{
                background: 'var(--bg-card, #1e293b)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '24px',
                width: '100%',
                maxWidth: '380px',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                <Lock size={20} color="var(--primary)" />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  3D Secure Card OTP
                </h4>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Simulating OTP sent to your registered mobile for ₹{effectiveAmount.toLocaleString()}.
              </p>

              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '14px' }}>
                Verification OTP: <strong>123456</strong>
              </div>

              <input
                type="text"
                maxLength={6}
                value={cardOtp}
                onChange={(e) => setCardOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit OTP"
                className="glass-input"
                style={{ width: '100%', padding: '12px', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '4px', marginBottom: '8px' }}
                autoFocus
              />

              {cardOtpError && (
                <span style={{ color: '#ef4444', fontSize: '0.75rem', marginBottom: '12px', display: 'block' }}>
                  {cardOtpError}
                </span>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  onClick={() => setShowCardOtpModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCardOtpVerify}
                  disabled={cardOtp.length !== 6}
                  style={{
                    flex: 1.5,
                    padding: '10px',
                    borderRadius: '8px',
                    background: cardOtp.length !== 6 ? 'var(--border-color)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: cardOtp.length !== 6 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Confirm OTP
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL OVERLAY 3: WALLET OTP SCREEN */}
        {showWalletOtpModal && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              zIndex: 100
            }}
          >
            <div
              style={{
                background: 'var(--bg-card, #1e293b)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '24px',
                width: '100%',
                maxWidth: '360px',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👛</div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                Wallet Authorization
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Enter OTP sent to your wallet number to debit ₹{effectiveAmount.toLocaleString()}.
              </p>

              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '14px' }}>
                Verification OTP: <strong>123456</strong>
              </div>

              <input
                type="text"
                maxLength={6}
                value={walletOtp}
                onChange={(e) => setWalletOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="glass-input"
                style={{ width: '100%', padding: '12px', fontSize: '1.1rem', textAlign: 'center', letterSpacing: '4px', marginBottom: '8px' }}
                autoFocus
              />

              {walletOtpError && (
                <span style={{ color: '#ef4444', fontSize: '0.75rem', marginBottom: '12px', display: 'block' }}>
                  {walletOtpError}
                </span>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  onClick={() => setShowWalletOtpModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleWalletOtpVerify}
                  disabled={walletOtp.length !== 6}
                  style={{
                    flex: 1.5,
                    padding: '10px',
                    borderRadius: '8px',
                    background: walletOtp.length !== 6 ? 'var(--border-color)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: walletOtp.length !== 6 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Approve Debit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL OVERLAY 4: NETBANKING LOGIN MODAL */}
        {showBankLoginModal && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              zIndex: 100
            }}
          >
            <div
              style={{
                background: 'var(--bg-card, #1e293b)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '24px',
                width: '100%',
                maxWidth: '380px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '4px' }}>🏦</div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {POPULAR_BANKS.find((b) => b.id === selectedBank)?.name}
                </h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Simulated Internet Banking Portal
                </span>
              </div>

              <form onSubmit={handleBankLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                    Customer ID / User ID
                  </label>
                  <input
                    type="text"
                    value={bankUserId}
                    onChange={(e) => setBankUserId(e.target.value)}
                    className="glass-input"
                    style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                    Login Password
                  </label>
                  <input
                    type="password"
                    value={bankPassword}
                    onChange={(e) => setBankPassword(e.target.value)}
                    className="glass-input"
                    style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
                    required
                  />
                </div>

                <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-subtle)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Total Amount to Debit: <strong>₹{effectiveAmount.toLocaleString()}</strong>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowBankLoginModal(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
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
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Approve Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
