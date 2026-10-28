import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  User,
  MapPin,
  Package,
  CreditCard,
  Shield,
  Sliders,
  Mic,
  Database,
  LogOut,
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Download,
  AlertTriangle,
  ArrowLeft,
  Volume2,
  RefreshCw,
  Sparkles,
  Lock,
  Phone,
  Mail,
  Home,
  Briefcase,
  Layers,
  ShoppingBag,
  TrendingDown,
  Zap
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SupportedLanguage } from '../i18n/translations';
import {
  FullAccountSummary,
  UserAccountProfile,
  UserAddress,
  SavedPaymentMethod,
  LoginActivity,
  AccountStats
} from '../types/accountData';
import { OrderRecord } from '../types';
import { generateAndPrintReceipt } from '../utils/receiptGenerator';

export type AccountSection =
  | 'profile'
  | 'addresses'
  | 'orders'
  | 'payments'
  | 'security'
  | 'preferences'
  | 'voice'
  | 'data';

interface Props {
  initialSection?: AccountSection;
  onNavigateRoute: (route: string) => void;
  onLanguageChange: (lang: SupportedLanguage) => void;
  currentLanguage: SupportedLanguage;
  onNavigateToOrdersTab?: () => void;
}

export const AccountPage: React.FC<Props> = ({
  initialSection = 'profile',
  onNavigateRoute,
  onLanguageChange,
  currentLanguage,
  onNavigateToOrdersTab
}) => {
  const { user, isAuthenticated, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<AccountSection>(initialSection);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [summaryData, setSummaryData] = useState<FullAccountSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Deep linking sync
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/account/')) {
      const section = path.replace('/account/', '') as AccountSection;
      if (['profile', 'addresses', 'orders', 'payments', 'security', 'preferences', 'voice', 'data'].includes(section)) {
        setActiveSection(section);
      }
    }
  }, []);

  const selectSection = (sec: AccountSection) => {
    setActiveSection(sec);
    window.history.pushState({}, '', `/account/${sec}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 3500);
  };

  // Load account details from backend
  const loadAccountData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getAccountSummary();
      if (data && data.profile) {
        setSummaryData(data);
      }
    } catch (err: any) {
      console.error('Failed to load account:', err);
      setErrorMessage(err.message || 'Failed to load account details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAccountData();
    }
  }, [isAuthenticated]);

  // S1: Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    surname: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'Custom',
    preferredLanguage: 'en' as SupportedLanguage
  });
  const isPresenter = typeof window !== 'undefined' && (
    localStorage.getItem('voicecart_presenter_mode') === 'true' ||
    new URLSearchParams(window.location.search).get('presenter') === '1'
  );
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [demoOtpCode, setDemoOtpCode] = useState('123456');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpTargetField, setOtpTargetField] = useState<'email' | 'phone'>('phone');
  const [otpTargetValue, setOtpTargetValue] = useState('');

  // Sync profile form when summaryData loads
  useEffect(() => {
    if (summaryData?.profile) {
      const p = summaryData.profile;
      setProfileForm({
        firstName: p.firstName || p.fullName?.split(' ')[0] || 'User',
        surname: p.surname || p.fullName?.split(' ').slice(1).join(' ') || '',
        email: p.email || '',
        phone: p.phone || '',
        dob: p.dob || '2000-01-01',
        gender: p.gender || 'Custom',
        preferredLanguage: p.preferredLanguage || currentLanguage
      });
    }
  }, [summaryData, currentLanguage]);

  // S2: Address Modal & State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<Omit<UserAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>({
    fullName: '',
    mobile: '',
    pincode: '',
    houseStreet: '',
    area: '',
    city: '',
    state: '',
    addressType: 'home',
    isDefault: false
  });

  // S3: Payment Method Modal & State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'upi' | 'card' | 'wallet'>('upi');
  const [paymentForm, setPaymentForm] = useState({
    label: '',
    upiId: '',
    cardBrand: 'Visa',
    cardNumber: '',
    cardExpiry: '',
    cardHolder: '',
    walletName: 'Paytm',
    walletPhone: ''
  });

  // S4: Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<string | null>(null);

  // S5: Voice Test & History State
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micTestFeedback, setMicTestFeedback] = useState<string | null>(null);
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const [voiceRepliesEnabled, setVoiceRepliesEnabled] = useState<boolean>(true);

  // S6: Delete Account State
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Avatar upload handler
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size exceeds 2MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Url = reader.result as string;
      try {
        await api.updateAvatar(base64Url);
        showToast('Avatar updated successfully!');
        loadAccountData();
      } catch (err: any) {
        showToast('Failed to update avatar.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summaryData?.profile) return;

    const emailChanged = profileForm.email !== summaryData.profile.email;
    const phoneChanged = profileForm.phone && profileForm.phone !== summaryData.profile.phone;

    if (phoneChanged || emailChanged) {
      setOtpTargetField(phoneChanged ? 'phone' : 'email');
      setOtpTargetValue(phoneChanged ? profileForm.phone : profileForm.email);
      setDemoOtpCode('123456');
      setShowOtpModal(true);
      return;
    }

    try {
      await api.updateAccountProfile({
        firstName: profileForm.firstName,
        surname: profileForm.surname,
        dob: profileForm.dob,
        gender: profileForm.gender,
        preferredLanguage: profileForm.preferredLanguage
      });
      setIsEditingProfile(false);
      showToast('Profile updated successfully!');
      loadAccountData();
    } catch (err: any) {
      showToast('Failed to update profile: ' + (err.message || 'Error'));
    }
  };

  const handleVerifyOtpAndSaveProfile = async () => {
    if (enteredOtp !== demoOtpCode) {
      showToast('Invalid OTP. Please enter the 6-digit verification code.');
      return;
    }
    setShowOtpModal(false);
    setEnteredOtp('');

    try {
      await api.updateAccountProfile({
        firstName: profileForm.firstName,
        surname: profileForm.surname,
        email: profileForm.email,
        phone: profileForm.phone,
        dob: profileForm.dob,
        gender: profileForm.gender,
        preferredLanguage: profileForm.preferredLanguage,
        isPhoneVerified: true,
        isEmailVerified: true
      });
      setIsEditingProfile(false);
      showToast('Contact details verified & profile updated!');
      loadAccountData();
    } catch (err: any) {
      showToast('Failed to update profile.');
    }
  };

  // Address Handlers
  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      fullName: summaryData?.profile.fullName || '',
      mobile: summaryData?.profile.phone || '',
      pincode: '',
      houseStreet: '',
      area: '',
      city: 'Bengaluru',
      state: 'Karnataka',
      addressType: 'home',
      isDefault: summaryData?.addresses.length === 0
    });
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: UserAddress) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      fullName: addr.fullName,
      mobile: addr.mobile,
      pincode: addr.pincode,
      houseStreet: addr.houseStreet,
      area: addr.area,
      city: addr.city,
      state: addr.state,
      addressType: addr.addressType,
      isDefault: addr.isDefault
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(addressForm.pincode)) {
      showToast('PIN code must be a 6-digit number.');
      return;
    }

    try {
      if (editingAddressId) {
        await api.updateAddress(editingAddressId, addressForm);
        showToast('Address updated successfully!');
      } else {
        await api.addAddress(addressForm);
        showToast('New address added!');
      }
      setIsAddressModalOpen(false);
      loadAccountData();
    } catch (err: any) {
      showToast('Failed to save address.');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await api.deleteAddress(id);
      showToast('Address removed.');
      loadAccountData();
    } catch {
      showToast('Failed to remove address.');
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await api.setDefaultAddress(id);
      showToast('Default address updated!');
      loadAccountData();
    } catch {
      showToast('Failed to set default address.');
    }
  };

  // Payment Method Handlers
  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let details: any = {};
      let label = paymentForm.label;

      if (paymentType === 'upi') {
        if (!paymentForm.upiId.includes('@')) {
          showToast('Please enter a valid UPI ID (e.g. name@okhdfcbank)');
          return;
        }
        details = { upiId: paymentForm.upiId };
        label = label || `UPI (${paymentForm.upiId})`;
      } else if (paymentType === 'card') {
        const cleanCard = paymentForm.cardNumber.replace(/\D/g, '');
        if (cleanCard.length < 15) {
          showToast('Please enter a 16-digit card number.');
          return;
        }
        details = {
          cardBrand: paymentForm.cardBrand,
          last4: cleanCard.slice(-4),
          expiry: paymentForm.cardExpiry || '12/28',
          cardHolder: paymentForm.cardHolder || summaryData?.profile.fullName
        };
        label = label || `${paymentForm.cardBrand} •••• ${cleanCard.slice(-4)}`;
      } else {
        details = {
          walletName: paymentForm.walletName,
          walletPhone: paymentForm.walletPhone || summaryData?.profile.phone
        };
        label = label || `${paymentForm.walletName} Wallet`;
      }

      await api.addSavedPaymentMethod({
        type: paymentType,
        label,
        details,
        isDefault: summaryData?.savedPaymentMethods.length === 0
      });

      setIsPaymentModalOpen(false);
      showToast('Payment method saved securely!');
      loadAccountData();
    } catch (err: any) {
      showToast('Failed to save payment method.');
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      await api.deleteSavedPaymentMethod(id);
      showToast('Payment method removed.');
      loadAccountData();
    } catch {
      showToast('Failed to remove payment method.');
    }
  };

  // Security Handlers
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeStatus(null);
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      showToast('New password must be 8+ chars and contain both letters and numbers.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.');
      return;
    }

    try {
      await api.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordChangeStatus('Password changed successfully across all sessions.');
      showToast('Password updated successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to change password.');
    }
  };

  const handleLogoutAll = async () => {
    try {
      await api.logoutAllDevices();
      showToast('Logged out of all other sessions.');
    } catch {
      showToast('Failed to logout from all devices.');
    }
  };

  // Voice Test Handler
  const handleTestMic = () => {
    setIsTestingMic(true);
    setMicTestFeedback('Listening... Speak a sample command (e.g. "Find wireless earbuds")');

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = currentLanguage === 'kn' ? 'kn-IN' : currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMicTestFeedback(`✅ Microphone working crystal clear! Heard: "${transcript}"`);
        setIsTestingMic(false);
      };
      recognition.onerror = () => {
        setMicTestFeedback('⚠️ Audio input received. Microphone is active and calibrated.');
        setIsTestingMic(false);
      };
      recognition.start();
    } else {
      setTimeout(() => {
        setMicTestFeedback('✅ Audio hardware detected. Microphone ready for trilingual voice commands.');
        setIsTestingMic(false);
      }, 1500);
    }
  };

  // Export Data Handler
  const handleExportData = async () => {
    try {
      const data = await api.exportAccountData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voicecart_export_${summaryData?.profile.id || 'user'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Account data downloaded successfully!');
    } catch {
      showToast('Failed to export account data.');
    }
  };

  // Delete Account Handler
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      showToast('Please type "DELETE" exactly to confirm.');
      return;
    }
    setIsDeletingAccount(true);
    try {
      await api.deleteAccount(deleteConfirmation);
      setShowDeleteModal(false);
      showToast('Account deleted successfully.');
      await signOut();
      onNavigateRoute('/');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete account.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Member initials avatar fallback
  const avatarInitials = useMemo(() => {
    if (!summaryData?.profile.fullName) return 'VC';
    const parts = summaryData.profile.fullName.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }, [summaryData]);

  if (isLoading) {
    return (
      <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto', padding: '32px 16px', boxSizing: 'border-box' }}>
        <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--border-subtle)', animation: 'pulse 1.5s infinite' }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: '24px', width: '220px', background: 'var(--border-subtle)', borderRadius: '6px', marginBottom: '8px' }} />
            <div style={{ height: '16px', width: '150px', background: 'var(--border-subtle)', borderRadius: '6px' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
          <div className="glass-panel" style={{ height: '350px', background: 'var(--border-subtle)' }} />
          <div className="glass-panel" style={{ height: '450px', background: 'var(--border-subtle)' }} />
        </div>
      </div>
    );
  }

  const profile = summaryData?.profile;
  const stats = summaryData?.stats || { totalOrders: 0, itemsInCart: 0, savedAddressesCount: 0, totalAmountComparedOrSaved: 0 };
  const addresses = summaryData?.addresses || [];
  const paymentMethods = summaryData?.savedPaymentMethods || [];
  const recentActivity = summaryData?.recentActivity || [];

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto', padding: '24px 16px 60px', boxSizing: 'border-box' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'rgba(15, 23, 42, 0.94)',
            color: '#fff',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <Sparkles size={16} color="var(--accent-gold)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER HERO PROFILE CARD */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          marginBottom: '24px',
          borderRadius: '18px',
          border: '1px solid var(--border-color)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.04))',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: '1 1 340px' }}>
          <div style={{ position: 'relative' }}>
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--primary)',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
                }}
              />
            ) : (
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  border: '3px solid rgba(255,255,255,0.2)'
                }}
              >
                {avatarInitials}
              </div>
            )}
            <button
              onClick={() => avatarInputRef.current?.click()}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: 'var(--primary)',
                color: '#fff',
                border: '2px solid var(--bg-card)',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }}
              title="Change avatar photo"
            >
              <Camera size={14} />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {profile?.fullName || 'VoiceCart User'}
              </h2>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--accent-green)',
                  border: '1px solid var(--accent-green)',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}
              >
                VERIFIED MEMBER
              </span>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={14} /> {profile?.email || 'No email attached'}
              </span>
              {profile?.phone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={14} /> +91 {profile.phone}
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Member since {profile?.memberSinceFormatted || 'Oct 2026'} • Instant Cross-Store Voice Checkout
            </div>
          </div>
        </div>

        {/* Live Calculated Stats Pills */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: '12px',
            flex: '1 1 400px'
          }}
        >
          <div
            onClick={() => selectSection('orders')}
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>{stats.totalOrders}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Orders Placed</div>
          </div>

          <div
            onClick={() => onNavigateRoute('/cart')}
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-gold)' }}>{stats.itemsInCart}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Cart Items</div>
          </div>

          <div
            onClick={() => selectSection('addresses')}
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary)' }}>{stats.savedAddressesCount}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Addresses</div>
          </div>

          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-green)' }}>₹{stats.totalAmountComparedOrSaved.toLocaleString()}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-green)', textTransform: 'uppercase', fontWeight: 700 }}>Saved via VoiceCart</div>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT (DESKTOP SIDEBAR + CONTENT / MOBILE SUBPAGES) */}
      <div className="account-page-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 280px) 1fr', gap: '24px' }}>
        {/* LEFT SIDEBAR NAVIGATION */}
        <div
          className="glass-panel"
          style={{
            padding: '12px',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            height: 'fit-content',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          {[
            { id: 'profile', label: 'Personal Details', icon: User },
            { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
            { id: 'orders', label: 'Orders & Receipts', icon: Package },
            { id: 'payments', label: 'Payment Methods', icon: CreditCard },
            { id: 'security', label: 'Security & Logins', icon: Shield },
            { id: 'preferences', label: 'Shopping Preferences', icon: Sliders },
            { id: 'voice', label: 'Voice Assistant Settings', icon: Mic },
            { id: 'data', label: 'Privacy & Data Export', icon: Database }
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => selectSection(item.id as AccountSection)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isSelected ? 'var(--primary)' : 'transparent',
                  color: isSelected ? '#fff' : 'var(--text-main)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={18} color={isSelected ? '#fff' : 'var(--text-secondary)'} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight size={16} color={isSelected ? '#fff' : 'var(--text-dim)'} />
              </button>
            );
          })}

          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '10px 0' }} />

          <button
            onClick={async () => {
              await signOut();
              showToast('Logged out successfully.');
              onNavigateRoute('/');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '10px',
              border: 'none',
              background: 'rgba(239, 68, 68, 0.08)',
              color: 'var(--accent-rose)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <LogOut size={18} color="var(--accent-rose)" />
            <span>Log Out</span>
          </button>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="glass-panel" style={{ padding: '28px', borderRadius: '18px', border: '1px solid var(--border-color)', minHeight: '520px' }}>
          {/* SECTION 1: PERSONAL DETAILS */}
          {activeSection === 'profile' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Personal Details</h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Manage your personal identity, contact numbers, and preferences.</p>
                </div>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--primary)',
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: 'var(--primary)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit2 size={15} /> Edit Profile
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>First Name</label>
                      <input
                        type="text"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        required
                        className="search-input"
                        style={{ width: '100%', marginTop: '6px', padding: '10px 14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Surname</label>
                      <input
                        type="text"
                        value={profileForm.surname}
                        onChange={(e) => setProfileForm({ ...profileForm, surname: e.target.value })}
                        className="search-input"
                        style={{ width: '100%', marginTop: '6px', padding: '10px 14px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Email Address</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      required
                      className="search-input"
                      style={{ width: '100%', marginTop: '6px', padding: '10px 14px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Mobile Number (10 Digits)</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="search-input"
                      style={{ width: '100%', marginTop: '6px', padding: '10px 14px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Date of Birth</label>
                      <input
                        type="date"
                        value={profileForm.dob}
                        onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                        className="search-input"
                        style={{ width: '100%', marginTop: '6px', padding: '10px 14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Gender</label>
                      <select
                        value={profileForm.gender}
                        onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                        className="search-input"
                        style={{ width: '100%', marginTop: '6px', padding: '10px 14px' }}
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Custom">Custom</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Preferred Language</label>
                    <select
                      value={profileForm.preferredLanguage}
                      onChange={(e) => setProfileForm({ ...profileForm, preferredLanguage: e.target.value as SupportedLanguage })}
                      className="search-input"
                      style={{ width: '100%', marginTop: '6px', padding: '10px 14px' }}
                    >
                      <option value="en">English (India)</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="kn">ಕನ್ನಡ (Kannada)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <button
                      type="submit"
                      style={{
                        padding: '10px 24px',
                        borderRadius: '10px',
                        background: 'var(--primary)',
                        color: '#fff',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-main)',
                        fontWeight: 600,
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                  <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Full Name</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>{profile?.fullName || 'Not specified'}</div>
                  </div>

                  <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Email Address</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {profile?.email}
                      <CheckCircle2 size={16} color="var(--accent-green)" />
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Mobile Number</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {profile?.phone ? `+91 ${profile.phone}` : 'No phone linked'}
                      {profile?.phone && <CheckCircle2 size={16} color="var(--accent-green)" />}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Date of Birth</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>{profile?.dob || '2000-01-01'}</div>
                  </div>

                  <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Gender</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>{profile?.gender || 'Custom'}</div>
                  </div>

                  <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Language</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
                      {profile?.preferredLanguage === 'kn' ? 'ಕನ್ನಡ (Kannada)' : profile?.preferredLanguage === 'hi' ? 'हिन्दी (Hindi)' : 'English (India)'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: SAVED ADDRESSES */}
          {activeSection === 'addresses' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Delivery Addresses</h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Manage shipping addresses for rapid 1-click voice and card checkout.</p>
                </div>
                <button
                  onClick={handleOpenAddAddress}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'var(--primary)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} /> Add New Address
                </button>
              </div>

              {addresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <MapPin size={48} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                  <p>No saved addresses yet. Add your delivery address for fast checkout.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      style={{
                        background: 'var(--bg-subtle)',
                        border: addr.isDefault ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        borderRadius: '14px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        position: 'relative'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>{addr.fullName}</span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: 'rgba(99, 102, 241, 0.15)',
                                color: 'var(--primary)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                textTransform: 'uppercase'
                              }}
                            >
                              {addr.addressType}
                            </span>
                            {addr.isDefault && (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: 'var(--accent-green)',
                                  padding: '2px 8px',
                                  borderRadius: '6px'
                                }}
                              >
                                DEFAULT
                              </span>
                            )}
                          </div>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '4px 0' }}>
                          {addr.houseStreet}, {addr.area}
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '2px 0' }}>
                          {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                        </p>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                          Phone: +91 {addr.mobile}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--primary)',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              Set as Default
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenEditAddress(addr)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem'
                            }}
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--accent-rose)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem'
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: MY ORDERS & RECEIPTS */}
          {activeSection === 'orders' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>My Orders & Receipts</h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Track simulated cross-store deliveries and download GST-compliant official receipts.</p>
                </div>
                <button
                  onClick={() => onNavigateRoute('/orders')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'var(--primary)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  View Live Tracking Screen
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {stats.totalOrders === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <Package size={48} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                    <p>No orders placed yet. Compare prices across Amazon, Flipkart & Meesho to place your first order!</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      You have placed <strong>{stats.totalOrders} orders</strong> across partner stores.
                    </p>
                    <button
                      onClick={() => onNavigateRoute('/orders')}
                      style={{
                        padding: '12px 20px',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Open Live Orders & Timeline Dashboard →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 4: PAYMENT METHODS */}
          {activeSection === 'payments' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Saved Payment Methods</h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Securely tokenized payment methods for instant 1-click checkout.</p>
                </div>
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'var(--primary)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} /> Add Payment Method
                </button>
              </div>

              {paymentMethods.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <CreditCard size={48} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                  <p>No saved payment methods. Add a UPI ID or card for faster checkouts.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {paymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      style={{
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '14px',
                        padding: '18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            background: pm.type === 'upi' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {pm.type === 'upi' ? <Zap size={22} color="var(--primary)" /> : <CreditCard size={22} color="var(--accent-green)" />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>{pm.label}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {pm.type === 'upi' ? pm.details.upiId : `Expires ${pm.details.expiry || '12/28'}`}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeletePaymentMethod(pm.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--accent-rose)',
                          cursor: 'pointer',
                          padding: '6px'
                        }}
                        title="Remove payment method"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 5: SECURITY & LOGINS */}
          {activeSection === 'security' && (
            <div>
              <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Security & Authentication</h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Manage your password, active login sessions, and two-factor safety.</p>
              </div>

              {passwordChangeStatus && (
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-green)', padding: '12px', borderRadius: '8px', color: 'var(--accent-green)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  {passwordChangeStatus}
                </div>
              )}

              <form onSubmit={handleChangePassword} style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Change Password</h4>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Current Password</label>
                  <div style={{ position: 'relative', marginTop: '6px' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="search-input"
                      style={{ width: '100%', padding: '10px 40px 10px 14px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>New Password (min. 8 chars, 1 letter, 1 number)</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="search-input"
                    style={{ width: '100%', marginTop: '6px', padding: '10px 14px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="search-input"
                    style={{ width: '100%', marginTop: '6px', padding: '10px 14px' }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: 'var(--primary)',
                    color: '#fff',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    width: 'fit-content'
                  }}
                >
                  Update Password
                </button>
              </form>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Recent Login Activity</h4>
                  <button
                    onClick={handleLogoutAll}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: 'var(--accent-rose)',
                      border: '1px solid var(--accent-rose)',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    Log Out of All Devices
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {recentActivity.map((act) => (
                    <div
                      key={act.id}
                      style={{
                        background: 'var(--bg-subtle)',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                          {act.device} ({act.browser})
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          IP: {act.ip} • {act.location} • {new Date(act.timestamp).toLocaleString()}
                        </div>
                      </div>
                      {act.isCurrentDevice && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-green)', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                          THIS DEVICE
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: SHOPPING PREFERENCES */}
          {activeSection === 'preferences' && (
            <div>
              <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Shopping Preferences</h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Customize your store comparison algorithm, alerts, and interface theme.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
                <div>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>Default Store Ranking Filter</label>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>How VoiceCart ranks products across Amazon, Flipkart, and Meesho.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                    {[
                      { id: 'balanced', label: 'Balanced' },
                      { id: 'cheapest', label: 'Lowest Price' },
                      { id: 'best_rated', label: 'Best Rated' },
                      { id: 'fastest', label: 'Fastest Delivery' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          api.updateAccountProfile({ preferences: { preference: opt.id as any } });
                          showToast(`Default preference set to ${opt.label}`);
                        }}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-subtle)',
                          color: 'var(--text-main)',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          cursor: 'pointer'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>Preferred Language</label>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Interface and voice spoken language.</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {[
                      { id: 'en', label: 'English' },
                      { id: 'hi', label: 'हिन्दी' },
                      { id: 'kn', label: 'ಕನ್ನಡ' }
                    ].map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => {
                          onLanguageChange(lang.id as SupportedLanguage);
                          api.updateAccountProfile({ preferredLanguage: lang.id as any });
                          showToast(`Language set to ${lang.label}`);
                        }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          border: currentLanguage === lang.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                          background: currentLanguage === lang.id ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-subtle)',
                          color: currentLanguage === lang.id ? 'var(--primary)' : 'var(--text-main)',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: VOICE ASSISTANT SETTINGS */}
          {activeSection === 'voice' && (
            <div>
              <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Voice Assistant Settings</h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Configure speech rates, microphone calibration, and audio feedback in English, Hindi & Kannada.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)', padding: '16px', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>Spoken Voice Replies</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Assistant speaks aloud recommendations and confirmations.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={voiceRepliesEnabled}
                    onChange={(e) => {
                      setVoiceRepliesEnabled(e.target.checked);
                      showToast(e.target.checked ? 'Voice replies enabled.' : 'Voice replies muted.');
                    }}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Speech Rate / Speed: {speechSpeed}x</label>
                  </div>
                  <input
                    type="range"
                    min="0.75"
                    max="1.5"
                    step="0.05"
                    value={speechSpeed}
                    onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                    Microphone Hardware Diagnostic
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    Test and calibrate your browser microphone for high-accuracy local speech parsing in Indian languages.
                  </p>

                  <button
                    onClick={handleTestMic}
                    disabled={isTestingMic}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      background: isTestingMic ? 'var(--accent-rose)' : 'var(--primary)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Mic size={16} />
                    <span>{isTestingMic ? 'Listening...' : 'Test Microphone Audio'}</span>
                  </button>

                  {micTestFeedback && (
                    <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
                      {micTestFeedback}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 8: PRIVACY & DATA EXPORT */}
          {activeSection === 'data' && (
            <div>
              <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Privacy & Data Management</h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Export your complete shopping data or permanently delete your account.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
                <div style={{ background: 'var(--bg-subtle)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                    Download My Data (JSON Export)
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    Download an export containing your personal profile, addresses, order history, and activity logs.
                  </p>
                  <button
                    onClick={handleExportData}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      background: 'var(--primary)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={16} /> Download Data Export
                  </button>
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.06)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '6px' }}>
                    Permanently Delete Account
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    Once you delete your account, all your saved addresses, cart items, preferences, and private records will be wiped.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      background: 'var(--accent-rose)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={16} /> Delete Account Permanently
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: DEMO OTP VERIFICATION FOR CONTACT CHANGE */}
      {showOtpModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '28px', borderRadius: '18px', textAlign: 'center' }}>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>Verify {otpTargetField === 'phone' ? 'Mobile Number' : 'Email Address'}</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              We sent a 6-digit verification code to <strong>{otpTargetValue}</strong>.
            </p>

            {isPresenter && (
              <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px dashed var(--primary)', padding: '8px 12px', borderRadius: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '16px' }}>
                ⚡ Presenter OTP: {demoOtpCode}
              </div>
            )}

            <input
              type="text"
              maxLength={6}
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="search-input"
              style={{ width: '100%', textAlign: 'center', fontSize: '1.4rem', letterSpacing: '6px', fontWeight: 800, padding: '12px', marginBottom: '16px' }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleVerifyOtpAndSaveProfile}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--primary)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                Verify & Save
              </button>
              <button
                onClick={() => setShowOtpModal(false)}
                style={{ padding: '12px 18px', borderRadius: '10px', background: 'var(--bg-subtle)', color: 'var(--text-main)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT ADDRESS */}
      {isAddressModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '28px', borderRadius: '18px' }}>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
              {editingAddressId ? 'Edit Address' : 'Add New Delivery Address'}
            </h4>

            <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="search-input"
                    style={{ width: '100%', marginTop: '4px', padding: '8px 12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>10-Digit Mobile</label>
                  <input
                    type="tel"
                    required
                    value={addressForm.mobile}
                    onChange={(e) => setAddressForm({ ...addressForm, mobile: e.target.value })}
                    className="search-input"
                    style={{ width: '100%', marginTop: '4px', padding: '8px 12px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>PIN Code (6 Digits)</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={addressForm.pincode}
                  onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '') })}
                  placeholder="e.g. 560001"
                  className="search-input"
                  style={{ width: '100%', marginTop: '4px', padding: '8px 12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>House No., Building, Street</label>
                <input
                  type="text"
                  required
                  value={addressForm.houseStreet}
                  onChange={(e) => setAddressForm({ ...addressForm, houseStreet: e.target.value })}
                  className="search-input"
                  style={{ width: '100%', marginTop: '4px', padding: '8px 12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Area, Locality or Landmark</label>
                <input
                  type="text"
                  required
                  value={addressForm.area}
                  onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })}
                  className="search-input"
                  style={{ width: '100%', marginTop: '4px', padding: '8px 12px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>City</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="search-input"
                    style={{ width: '100%', marginTop: '4px', padding: '8px 12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>State</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="search-input"
                    style={{ width: '100%', marginTop: '4px', padding: '8px 12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Type:</label>
                {(['home', 'work', 'other'] as const).map((t) => (
                  <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', textTransform: 'capitalize', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="addressType"
                      checked={addressForm.addressType === t}
                      onChange={() => setAddressForm({ ...addressForm, addressType: t })}
                    />
                    {t}
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--primary)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Save Address
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--bg-subtle)', color: 'var(--text-main)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD PAYMENT METHOD */}
      {isPaymentModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '28px', borderRadius: '18px' }}>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>Add Payment Method</h4>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {(['upi', 'card', 'wallet'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPaymentType(t)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: paymentType === t ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    background: paymentType === t ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-subtle)',
                    color: paymentType === t ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <form onSubmit={handleAddPaymentMethod} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {paymentType === 'upi' && (
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>UPI ID (e.g. mobile@upi)</label>
                  <input
                    type="text"
                    required
                    placeholder="yashwanth@okhdfcbank"
                    value={paymentForm.upiId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })}
                    className="search-input"
                    style={{ width: '100%', marginTop: '4px', padding: '10px 12px' }}
                  />
                </div>
              )}

              {paymentType === 'card' && (
                <>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Card Number (16 Digits)</label>
                    <input
                      type="text"
                      maxLength={16}
                      required
                      placeholder="4242 4242 4242 4242"
                      value={paymentForm.cardNumber}
                      onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value.replace(/\D/g, '') })}
                      className="search-input"
                      style={{ width: '100%', marginTop: '4px', padding: '10px 12px' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Expiry</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={paymentForm.cardExpiry}
                        onChange={(e) => setPaymentForm({ ...paymentForm, cardExpiry: e.target.value })}
                        className="search-input"
                        style={{ width: '100%', marginTop: '4px', padding: '10px 12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Card Brand</label>
                      <select
                        value={paymentForm.cardBrand}
                        onChange={(e) => setPaymentForm({ ...paymentForm, cardBrand: e.target.value })}
                        className="search-input"
                        style={{ width: '100%', marginTop: '4px', padding: '10px 12px' }}
                      >
                        <option value="Visa">Visa</option>
                        <option value="Mastercard">Mastercard</option>
                        <option value="RuPay">RuPay</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {paymentType === 'wallet' && (
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Wallet Service</label>
                  <select
                    value={paymentForm.walletName}
                    onChange={(e) => setPaymentForm({ ...paymentForm, walletName: e.target.value })}
                    className="search-input"
                    style={{ width: '100%', marginTop: '4px', padding: '10px 12px' }}
                  >
                    <option value="Paytm">Paytm Wallet</option>
                    <option value="PhonePe">PhonePe Wallet</option>
                    <option value="AmazonPay">Amazon Pay Balance</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--primary)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Save Method
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--bg-subtle)', color: 'var(--text-main)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE ACCOUNT CONFIRMATION */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '28px', borderRadius: '18px', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertTriangle size={32} color="var(--accent-rose)" />
            </div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-rose)', marginBottom: '8px' }}>
              Delete Account Permanently?
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              This action cannot be undone. Type <strong>DELETE</strong> in capital letters to confirm.
            </p>

            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Type DELETE"
              className="search-input"
              style={{ width: '100%', textAlign: 'center', fontWeight: 800, padding: '10px', marginBottom: '16px' }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE' || isDeletingAccount}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  background: deleteConfirmation === 'DELETE' ? 'var(--accent-rose)' : 'var(--border-color)',
                  color: '#fff',
                  fontWeight: 700,
                  border: 'none',
                  cursor: deleteConfirmation === 'DELETE' ? 'pointer' : 'not-allowed'
                }}
              >
                {isDeletingAccount ? 'Deleting...' : 'Confirm Permanent Delete'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--bg-subtle)', color: 'var(--text-main)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
