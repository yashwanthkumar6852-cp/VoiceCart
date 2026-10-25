import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Sparkles, AlertCircle, CheckCircle2, RefreshCw, Phone, Mail, ArrowRight, Lock, Globe, X, User, Clipboard } from 'lucide-react';
import { SupportedLanguage } from '../i18n/translations';
import { recentAccountsManager, RecentAccount, formatRelativeTime, maskIdentifier } from '../services/recentAccounts';

interface Props {
  onNavigate: (path: string) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  pendingNotice?: string | null;
}

export const LoginPage: React.FC<Props> = ({
  onNavigate,
  language,
  onLanguageChange,
  pendingNotice
}) => {
  const {
    isAuthenticated,
    signIn,
    sendOtp,
    verifyOtp,
    checkOtpStatus,
    toggleDemoMode,
    isConfigured,
    signInWithOAuth
  } = useAuth();

  // If already logged in, redirect home
  useEffect(() => {
    if (isAuthenticated) {
      onNavigate('/');
    }
  }, [isAuthenticated, onNavigate]);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Recent Accounts State (Maximum 3)
  const [recentAccounts, setRecentAccounts] = useState<RecentAccount[]>(() => recentAccountsManager.getRecentAccounts());
  const [selectedRecentAccount, setSelectedRecentAccount] = useState<RecentAccount | null>(null);

  // OTP sub-state
  const [isOtpFlow, setIsOtpFlow] = useState(false);
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [demoOtpNotice, setDemoOtpNotice] = useState<string | null>(null);
  const [maskedTarget, setMaskedTarget] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState('');
  const [isNewUserStep, setIsNewUserStep] = useState(false);
  const [clipboardCode, setClipboardCode] = useState<string | null>(null);

  // Status & Error feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hiddenOtpInputRef = useRef<HTMLInputElement | null>(null);
  const webOtpAbortRef = useRef<AbortController | null>(null);

  // Translations
  const i18n = {
    en: {
      tagline: 'Compare Amazon, Flipkart and Meesho prices and shop by voice.',
      benefit1: 'Live 3-store cross-price comparison',
      benefit2: 'Hands-free voice shopping in Kannada, Hindi & English',
      benefit3: 'Instant checkout & unified order tracking',
      welcomeBack: 'Welcome back',
      recentAccountsHint: 'Choose an account to sign in with one tap',
      continueAs: (name: string) => `Continue as ${name}`,
      useAnother: 'Use another account',
      lastUsed: (t: string) => `last used ${t}`,
      loginHeading: 'Log in to VoiceCart',
      identifierPlaceholder: 'Email address or 10-digit mobile number',
      passwordPlaceholder: 'Password',
      loginBtn: 'Log in with Password',
      loginWithOtpBtn: 'Log in with OTP',
      forgotPassword: 'Forgotten password?',
      orDivider: 'or',
      createNewAccount: 'Create new account',
      continueWithGoogle: 'Continue with Google',
      quickAccess: '⚡ 1-Click Instant Access',
      rememberMe: 'Remember me',
      footerNote: 'Shop smarter, save faster with VoiceCart India.',
      verifyOtpHeading: 'Enter 6-Digit Code',
      otpSentTo: (target: string) => `We sent a 6-digit verification code to ${target}`,
      changeNumber: 'Change email or number',
      resendIn: (s: number) => `Resend code in ${s}s`,
      resendNow: 'Resend Code',
      verifyBtn: 'Verify Code & Log In',
      namePrompt: 'Enter your full name to complete profile',
      completeProfileBtn: 'Complete & Continue',
      pasteFromClipboard: (code: string) => `📋 Paste code ${code}`,
      terms: 'Terms',
      privacy: 'Privacy Policy'
    },
    hi: {
      tagline: 'अमेज़न, फ्लिपकार्ट और मीशो की कीमतों की तुलना करें और आवाज़ से खरीदारी करें।',
      benefit1: 'लाइव 3-स्टोर मूल्य तुलना',
      benefit2: 'कन्नड़, हिन्दी और अंग्रेज़ी में वॉइस शॉपिंग',
      benefit3: 'त्वरित चेकआउट और एकीकृत ऑर्डर ट्रैकिंग',
      welcomeBack: 'वापसी पर स्वागत है',
      recentAccountsHint: 'एक टैप में लॉग इन करने के लिए खाता चुनें',
      continueAs: (name: string) => `${name} के रूप में जारी रखें`,
      useAnother: 'अन्य खाते का उपयोग करें',
      lastUsed: (t: string) => `पिछला उपयोग: ${t}`,
      loginHeading: 'वॉइसकार्ट में लॉग इन करें',
      identifierPlaceholder: 'ईमेल पता या 10 अंकों का मोबाइल नंबर',
      passwordPlaceholder: 'पासवर्ड',
      loginBtn: 'पासवर्ड से लॉग इन करें',
      loginWithOtpBtn: 'ओटीपी से लॉग इन करें',
      forgotPassword: 'पासवर्ड भूल गए?',
      orDivider: 'या',
      createNewAccount: 'नया खाता बनाएं',
      continueWithGoogle: 'गूगल से जारी रखें',
      quickAccess: '⚡ 1-क्लिक त्वरित प्रवेश',
      rememberMe: 'मुझे याद रखें',
      footerNote: 'वॉइसकार्ट के साथ समझदारी से खरीदारी करें।',
      verifyOtpHeading: '6 अंकों का कोड दर्ज करें',
      otpSentTo: (target: string) => `हमने ${target} पर 6 अंकों का कोड भेजा है`,
      changeNumber: 'बदलें',
      resendIn: (s: number) => `${s}s में पुनः भेजें`,
      resendNow: 'कोड दोबारा भेजें',
      verifyBtn: 'सत्यापित करें और लॉग इन करें',
      namePrompt: 'प्रोफ़ाइल पूरी करने के लिए अपना नाम दर्ज करें',
      completeProfileBtn: 'जारी रखें',
      pasteFromClipboard: (code: string) => `📋 कोड पेस्ट करें: ${code}`,
      terms: 'नियम व शर्तें',
      privacy: 'गोपनीयता नीति'
    },
    kn: {
      tagline: 'ಅಮೆಜಾನ್, ಫ್ಲಿಪ್‌ಕಾರ್ಟ್ ಮತ್ತು ಮೀಶೋ ಬೆಲೆಗಳನ್ನು ಹೋಲಿಸಿ ಮತ್ತು ಧ್ವನಿಯ ಮೂಲಕ ಶಾಪಿಂಗ್ ಮಾಡಿ.',
      benefit1: 'ನೈಜ ಸಮಯದ 3-ಸ್ಟೋರ್ ಬೆಲೆ ಹೋಲಿಕೆ',
      benefit2: 'ಕನ್ನಡ, ಹಿಂದಿ & ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಧ್ವನಿ ಶಾಪಿಂಗ್',
      benefit3: 'ತ್ವರಿತ ಚೆಕ್‌ಔಟ್ ಮತ್ತು ಆರ್ಡರ್ ಟ್ರ್ಯಾಕಿಂಗ್',
      welcomeBack: 'ಮರಳಿ ಸ್ವಾಗತ',
      recentAccountsHint: 'ಒಂದೇ ಟ್ಯಾಪ್‌ನಲ್ಲಿ ಲಾಗಿನ್ ಮಾಡಲು ಖಾತೆಯನ್ನು ಆರಿಸಿ',
      continueAs: (name: string) => `${name} ಆಗಿ ಮುಂದುವರಿಯಿರಿ`,
      useAnother: 'ಬೇರೆ ಖಾತೆ ಬಳಸಿ',
      lastUsed: (t: string) => `ಕೊನೆಯ ಬಳಕೆ: ${t}`,
      loginHeading: 'ವಾಯ್ಸ್‌ಕಾರ್ಟ್‌ಗೆ ಲಾಗ್ ಇನ್ ಮಾಡಿ',
      identifierPlaceholder: 'ಇಮೇಲ್ ಅಥವಾ 10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
      passwordPlaceholder: 'ಪಾಸ್‌ವರ್ಡ್',
      loginBtn: 'ಪಾಸ್‌ವರ್ಡ್‌ನೊಂದಿಗೆ ಲಾಗ್ ಇನ್',
      loginWithOtpBtn: 'ಒಟಿಪಿ ಮೂಲಕ ಲಾಗಿನ್',
      forgotPassword: 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?',
      orDivider: 'ಅಥವಾ',
      createNewAccount: 'ಹೊಸ ಖಾತೆ ರಚಿಸಿ',
      continueWithGoogle: 'ಗೂಗಲ್ ಮೂಲಕ ಮುಂದುವರಿಯಿರಿ',
      quickAccess: '⚡ 1-ಕ್ಲಿಕ್ ತ್ವರಿತ ಪ್ರವೇಶ',
      rememberMe: 'ನನ್ನನ್ನು ನೆನಪಿಡಿ',
      footerNote: 'ವಾಯ್ಸ್‌ಕಾರ್ಟ್‌ನೊಂದಿಗೆ ಉತ್ತಮವಾಗಿ ಶಾಪಿಂಗ್ ಮಾಡಿ.',
      verifyOtpHeading: '6 ಅಂಕಿಗಳ ಕೋಡ್ ನಮೂದಿಸಿ',
      otpSentTo: (target: string) => `ನಾವು ${target} ಗೆ 6 ಅಂಕಿಗಳ ಕೋಡ್ ಕಳುಹಿಸಿದ್ದೇವೆ`,
      changeNumber: 'ಬದಲಾಯಿಸಿ',
      resendIn: (s: number) => `${s}s ನಲ್ಲಿ ಮರುಕಳುಹಿಸಿ`,
      resendNow: 'ಮತ್ತೆ ಕೋಡ್ ಕಳುಹಿಸಿ',
      verifyBtn: 'ದೃಢೀಕರಿಸಿ ಲಾಗಿನ್ ಮಾಡಿ',
      namePrompt: 'ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಲು ನಿಮ್ಮ ಹೆಸರು ನಮೂದಿಸಿ',
      completeProfileBtn: 'ಮುಂದುವರಿಯಿರಿ',
      pasteFromClipboard: (code: string) => `📋 ಕೋಡ್ ಪೇಸ್ಟ್ ಮಾಡಿ: ${code}`,
      terms: 'ನಿಯಮಗಳು',
      privacy: 'ಗೌಪ್ಯತಾ ನೀತಿ'
    }
  };

  const t = i18n[language === 'auto' ? 'en' : language] || i18n.en;

  // Auto-select latest recent account if available
  useEffect(() => {
    const list = recentAccountsManager.getRecentAccounts();
    setRecentAccounts(list);
    if (list.length > 0 && !selectedRecentAccount) {
      setSelectedRecentAccount(list[0]);
    }
  }, []);

  // Resend Timer Countdown
  useEffect(() => {
    let interval: any = null;
    if (isOtpFlow && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOtpFlow, resendTimer]);

  // Web OTP API (Android Chrome SMS autofill)
  useEffect(() => {
    if (!isOtpFlow) return;

    if ('OTPCredential' in window && navigator.credentials) {
      const ac = new AbortController();
      webOtpAbortRef.current = ac;

      navigator.credentials
        .get({
          otp: { transport: ['sms'] },
          signal: ac.signal
        } as any)
        .then((content: any) => {
          if (content && content.code) {
            const digits = content.code.slice(0, 6).split('');
            setOtpValues(digits);
            submitOtpVerification(content.code);
          }
        })
        .catch(() => {
          // Web OTP aborted or unsupported, fallback silently
        });

      return () => {
        ac.abort();
      };
    }
  }, [isOtpFlow]);

  // Email Magic Link Auto-Updating Polling (syncs if verified in another tab/device)
  useEffect(() => {
    if (!isOtpFlow || !identifier) return;

    const interval = setInterval(async () => {
      try {
        const res = await checkOtpStatus(identifier);
        if (res.verified) {
          setSuccessMsg('Signed in successfully via email verification link!');
          setTimeout(() => onNavigate('/'), 400);
        }
      } catch {
        // ignore
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isOtpFlow, identifier]);

  // Clipboard 6-digit detection when tab regains focus
  useEffect(() => {
    const handleFocus = async () => {
      if (!isOtpFlow) return;
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          const clean = (text || '').trim();
          if (/^\d{6}$/.test(clean)) {
            setClipboardCode(clean);
          }
        }
      } catch {
        // clipboard access restricted
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isOtpFlow]);

  const handleRemoveRecentAccount = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    recentAccountsManager.removeRecentAccount(userId);
    const updated = recentAccountsManager.getRecentAccounts();
    setRecentAccounts(updated);
    if (selectedRecentAccount?.userId === userId) {
      setSelectedRecentAccount(updated[0] || null);
    }
  };

  // 1-Tap Quick Re-Login with OTP
  const handleQuickReLogin = async (acc: RecentAccount) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await sendOtp({ userId: acc.userId });
      if (res.success) {
        setIdentifier(res.identifier || acc.maskedIdentifier);
        setMaskedTarget(res.maskedIdentifier || acc.maskedIdentifier);
        setIsOtpFlow(true);
        setResendTimer(res.resendCooldownSeconds || 30);
        setCanResend(false);
        setSuccessMsg(res.message || 'Verification code sent!');
        if (res.demoOtp) {
          setDemoOtpNotice(res.demoOtp);
        }
        setTimeout(() => {
          hiddenOtpInputRef.current?.focus();
          otpInputRefs.current[0]?.focus();
        }, 150);
      } else {
        setErrorMsg(res.error || 'Failed to send verification code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting to auth server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setErrorMsg('Please enter your email address or 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(cleanInput);
      if (res.success) {
        setIsOtpFlow(true);
        setMaskedTarget(res.maskedIdentifier || maskIdentifier(cleanInput));
        setResendTimer(res.resendCooldownSeconds || 30);
        setCanResend(false);
        setSuccessMsg(res.message || 'Verification code sent!');
        if (res.demoOtp) {
          setDemoOtpNotice(res.demoOtp);
        }
        setTimeout(() => {
          hiddenOtpInputRef.current?.focus();
          otpInputRefs.current[0]?.focus();
        }, 150);
      } else {
        setErrorMsg(res.error || 'Failed to send verification code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting to auth server.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setErrorMsg('Please enter your email or mobile number.');
      return;
    }

    // If no password entered, trigger OTP flow by default
    if (!password) {
      await handleSendOtp();
      return;
    }

    // Email + Password Flow
    setLoading(true);
    try {
      const res = await signIn(cleanInput, password, rememberMe);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('Logged in successfully! Redirecting...');
        setTimeout(() => onNavigate('/'), 400);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Mirrored hidden input onChange (handles mobile keyboard one-time-code auto-fill)
  const handleFullOtpInputChange = (fullVal: string) => {
    const digits = fullVal.replace(/\D/g, '').slice(0, 6);
    const newValues = ['', '', '', '', '', ''];
    for (let i = 0; i < digits.length; i++) {
      newValues[i] = digits[i];
    }
    setOtpValues(newValues);

    if (digits.length === 6) {
      submitOtpVerification(digits);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newValues = [...otpValues];
    newValues[index] = digit;
    setOtpValues(newValues);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5 && newValues.every((d) => d !== '')) {
      submitOtpVerification(newValues.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newValues = [...otpValues];
    for (let i = 0; i < 6; i++) {
      newValues[i] = pastedData[i] || '';
    }
    setOtpValues(newValues);

    const nextIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextIndex]?.focus();

    if (pastedData.length === 6) {
      submitOtpVerification(pastedData);
    }
  };

  const submitOtpVerification = async (enteredOtp: string, customName?: string) => {
    setErrorMsg(null);
    setLoading(true);

    const cleanId = identifier.trim();
    try {
      const res = await verifyOtp(cleanId, enteredOtp, customName || newUserName, language === 'auto' ? 'en' : language, rememberMe);
      if (res.success) {
        if (res.isNewUser && !customName && !newUserName) {
          setIsNewUserStep(true);
          setLoading(false);
          return;
        }

        setSuccessMsg('Logged in successfully! Redirecting...');
        setTimeout(() => onNavigate('/'), 400);
      } else {
        setErrorMsg(res.error || 'Invalid verification code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    await submitOtpVerification(otpValues.join(''), newUserName.trim());
  };

  const handleDemoLogin = () => {
    toggleDemoMode(true);
    setSuccessMsg('Logged in successfully!');
    setTimeout(() => onNavigate('/'), 300);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main, #f0f2f5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        fontFamily: language === 'kn' ? "'Noto Sans Kannada', sans-serif" : "'Inter', sans-serif"
      }}
    >
      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '1040px',
          width: '100%',
          margin: '0 auto',
          padding: '40px 16px'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            gap: '48px',
            flexWrap: 'wrap'
          }}
        >
          {/* LEFT COLUMN: Logo & Tagline */}
          <div style={{ flex: '1 1 440px', maxWidth: '500px', marginBottom: '16px' }}>
            <div
              onClick={() => onNavigate('/')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '16px' }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(24, 119, 242, 0.25)'
                }}
              >
                <img
                  src="/logo.png"
                  alt="VoiceCart"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <h1
                style={{
                  fontSize: '2.6rem',
                  fontWeight: 900,
                  letterSpacing: '-1px',
                  color: '#1877f2',
                  margin: 0
                }}
              >
                Voice<span style={{ color: '#06b6d4' }}>Cart</span>
              </h1>
            </div>

            <p
              style={{
                fontSize: '1.45rem',
                lineHeight: 1.35,
                fontWeight: 500,
                color: 'var(--text-main, #1c1e21)',
                marginBottom: '28px'
              }}
            >
              {t.tagline}
            </p>

            {/* Benefit Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[t.benefit1, t.benefit2, t.benefit3].map((b, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', color: 'var(--text-secondary, #65676b)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1877f2' }} />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: White Card */}
          <div style={{ flex: '1 1 380px', maxWidth: '440px', width: '100%' }}>
            {pendingNotice && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: 'var(--accent-gold, #d97706)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}
              >
                <AlertCircle size={18} />
                <span>{pendingNotice}</span>
              </div>
            )}

            <div
              style={{
                background: 'var(--bg-card, #ffffff)',
                borderRadius: '16px',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05)',
                padding: '24px',
                border: '1px solid var(--border-color, #e4e6eb)'
              }}
            >
              {/* Feedback Alerts */}
              {errorMsg && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              {!isOtpFlow ? (
                <div>
                  {/* PART A: WELCOME BACK RECENT ACCOUNTS CARD */}
                  {recentAccounts.length > 0 && selectedRecentAccount ? (
                    <div style={{ marginBottom: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main, #1c1e21)' }}>
                          {t.welcomeBack}
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #8a8d91)' }}>
                          {t.lastUsed(formatRelativeTime(selectedRecentAccount.lastLoginAt))}
                        </span>
                      </div>

                      {/* Recent Account Chips List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                        {recentAccounts.map((acc) => {
                          const isSelected = selectedRecentAccount.userId === acc.userId;
                          return (
                            <div
                              key={acc.userId}
                              onClick={() => {
                                setSelectedRecentAccount(acc);
                                setIdentifier(acc.maskedIdentifier);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 12px',
                                borderRadius: '10px',
                                border: isSelected ? '2px solid #1877f2' : '1px solid var(--border-color, #e4e6eb)',
                                background: isSelected ? 'rgba(24, 119, 242, 0.06)' : 'var(--bg-subtle, #f0f2f5)',
                                cursor: 'pointer',
                                transition: 'all 0.18s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div
                                  style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #1877f2, #06b6d4)',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '1rem'
                                  }}
                                >
                                  {acc.avatarInitial}
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main, #1c1e21)' }}>
                                    {acc.displayName}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #65676b)' }}>
                                    {acc.maskedIdentifier}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                aria-label="Remove account"
                                onClick={(e) => handleRemoveRecentAccount(e, acc.userId)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-muted, #8a8d91)',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  borderRadius: '50%'
                                }}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* 1-Tap Continue Button */}
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleQuickReLogin(selectedRecentAccount)}
                        style={{
                          width: '100%',
                          padding: '14px',
                          background: '#1877f2',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '1.02rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxShadow: '0 2px 8px rgba(24, 119, 242, 0.35)',
                          marginBottom: '8px'
                        }}
                      >
                        {loading ? <RefreshCw size={20} className="mic-active-pulse" /> : t.continueAs(selectedRecentAccount.displayName)}
                      </button>

                      <div style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecentAccount(null);
                            setIdentifier('');
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#1877f2',
                            fontSize: '0.86rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {t.useAnother}
                        </button>
                      </div>

                      {/* Divider */}
                      <div style={{ borderBottom: '1px solid var(--border-color, #dadde1)', margin: '16px 0' }} />
                    </div>
                  ) : null}

                  {/* STANDARD LOGIN FORM */}
                  {(!selectedRecentAccount || recentAccounts.length === 0) && (
                    <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <input
                          type="text"
                          required
                          autoFocus
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder={t.identifierPlaceholder}
                          style={{
                            width: '100%',
                            padding: '14px 16px',
                            fontSize: '1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color, #ccd0d5)',
                            background: 'var(--bg-input, #ffffff)',
                            color: 'var(--text-main, #1c1e21)',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t.passwordPlaceholder}
                          style={{
                            width: '100%',
                            padding: '14px 44px 14px 16px',
                            fontSize: '1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color, #ccd0d5)',
                            background: 'var(--bg-input, #ffffff)',
                            color: 'var(--text-main, #1c1e21)',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted, #8a8d91)',
                            cursor: 'pointer'
                          }}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary, #65676b)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                          />
                          <span>{t.rememberMe}</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => onNavigate('/forgot-password')}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#1877f2',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          {t.forgotPassword}
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={handleSendOtp}
                          style={{
                            flex: 1,
                            padding: '14px',
                            background: '#1877f2',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '1rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 8px rgba(24, 119, 242, 0.3)'
                          }}
                        >
                          {loading ? <RefreshCw size={20} className="mic-active-pulse" /> : t.loginWithOtpBtn}
                        </button>

                        {password && (
                          <button
                            type="submit"
                            disabled={loading}
                            style={{
                              padding: '14px 18px',
                              background: 'rgba(24, 119, 242, 0.1)',
                              border: '1px solid rgba(24, 119, 242, 0.3)',
                              borderRadius: '8px',
                              color: '#1877f2',
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {t.loginBtn}
                          </button>
                        )}
                      </div>
                    </form>
                  )}

                  {/* Create New Account Button (Green) */}
                  <div style={{ textAlign: 'center', marginTop: '14px' }}>
                    <button
                      type="button"
                      onClick={() => onNavigate('/signup')}
                      style={{
                        padding: '12px 24px',
                        background: '#42b72a',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '1rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(66, 183, 42, 0.3)'
                      }}
                    >
                      {t.createNewAccount}
                    </button>
                  </div>

                  {/* 1-Click Access & Google Sign-In */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={handleDemoLogin}
                      style={{
                        width: '100%',
                        padding: '11px',
                        background: 'rgba(99, 102, 241, 0.08)',
                        border: '1.5px dashed rgba(99, 102, 241, 0.4)',
                        borderRadius: '8px',
                        color: '#4f46e5',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{t.quickAccess}</span>
                    </button>

                    {isConfigured && (
                      <button
                        type="button"
                        onClick={() => signInWithOAuth('google')}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'var(--bg-subtle, #f0f2f5)',
                          border: '1px solid var(--border-color, #ccd0d5)',
                          borderRadius: '8px',
                          color: 'var(--text-main, #1c1e21)',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <span>{t.continueWithGoogle}</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : isNewUserStep ? (
                /* FIRST TIME NEW USER NAME STEP */
                <form onSubmit={handleFinishNewUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    {t.namePrompt}
                  </h3>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Yashwanth Kumar"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: '1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #ccd0d5)',
                      background: 'var(--bg-input, #ffffff)',
                      color: 'var(--text-main, #1c1e21)',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: '#42b72a',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {loading ? <RefreshCw size={18} className="mic-active-pulse" /> : t.completeProfileBtn}
                  </button>
                </form>
              ) : (
                /* 6-DIGIT OTP STEP WITH HIDDEN AUTO-FILL INPUT & WEB OTP */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                        {t.verifyOtpHeading}
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                        {t.otpSentTo(maskedTarget || identifier)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOtpFlow(false)}
                      style={{ background: 'transparent', border: 'none', color: '#1877f2', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {t.changeNumber}
                    </button>
                  </div>

                  {/* Clipboard Quick-Paste Chip */}
                  {clipboardCode && (
                    <button
                      type="button"
                      onClick={() => {
                        const digits = clipboardCode.split('');
                        setOtpValues(digits);
                        submitOtpVerification(clipboardCode);
                        setClipboardCode(null);
                      }}
                      style={{
                        background: 'rgba(24, 119, 242, 0.1)',
                        border: '1px solid rgba(24, 119, 242, 0.3)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#1877f2',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <span>{t.pasteFromClipboard(clipboardCode)}</span>
                    </button>
                  )}

                  {/* Hidden Input with autocomplete="one-time-code" for Mobile Keyboards */}
                  <input
                    ref={hiddenOtpInputRef}
                    type="text"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otpValues.join('')}
                    onChange={(e) => handleFullOtpInputChange(e.target.value)}
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      pointerEvents: 'none',
                      width: '1px',
                      height: '1px'
                    }}
                  />

                  {/* Demo OTP Notice Box */}
                  {demoOtpNotice && (
                    <div
                      style={{
                        background: 'rgba(24, 119, 242, 0.08)',
                        border: '1px solid rgba(24, 119, 242, 0.25)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        color: '#1877f2',
                        marginBottom: '12px'
                      }}
                    >
                      <span>Demo OTP: <strong>{demoOtpNotice}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          const digits = demoOtpNotice.split('');
                          setOtpValues(digits);
                          submitOtpVerification(demoOtpNotice);
                        }}
                        style={{
                          background: '#1877f2',
                          color: '#fff',
                          border: 'none',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}

                  {/* 6 Visible Digit Boxes */}
                  <div
                    style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}
                    onPaste={handleOtpPaste}
                    onClick={() => hiddenOtpInputRef.current?.focus()}
                  >
                    {otpValues.map((val, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={val}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        style={{
                          width: '46px',
                          height: '52px',
                          textAlign: 'center',
                          fontSize: '1.4rem',
                          fontWeight: 700,
                          borderRadius: '8px',
                          border: val ? '2px solid #1877f2' : '2px solid var(--border-color, #ccd0d5)',
                          background: 'var(--bg-input, #ffffff)',
                          color: 'var(--text-main, #1c1e21)',
                          outline: 'none',
                          boxShadow: val ? '0 0 0 2px rgba(24, 119, 242, 0.15)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      />
                    ))}
                  </div>

                  {/* Resend Action */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <span>Didn't receive code?</span>
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        style={{ background: 'transparent', border: 'none', color: '#1877f2', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        {t.resendNow}
                      </button>
                    ) : (
                      <span>{t.resendIn(resendTimer)}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={loading || otpValues.some((d) => d === '')}
                    onClick={() => submitOtpVerification(otpValues.join(''))}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: '#1877f2',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 8px rgba(24, 119, 242, 0.35)'
                    }}
                  >
                    {loading ? <RefreshCw size={18} className="mic-active-pulse" /> : t.verifyBtn}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer
        style={{
          maxWidth: '1040px',
          width: '100%',
          margin: '0 auto',
          borderTop: '1px solid var(--border-color, #dadde1)',
          paddingTop: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '0.78rem',
          color: 'var(--text-muted, #8a8d91)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={14} />
          {[
            { code: 'en', label: 'English' },
            { code: 'hi', label: 'हिन्दी' },
            { code: 'kn', label: 'ಕನ್ನಡ' }
          ].map((item) => (
            <button
              key={item.code}
              onClick={() => onLanguageChange(item.code as any)}
              style={{
                background: 'transparent',
                border: 'none',
                color: language === item.code ? '#1877f2' : 'var(--text-muted, #8a8d91)',
                fontWeight: language === item.code ? 700 : 500,
                cursor: 'pointer',
                padding: '2px 4px'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={() => onNavigate('/terms')}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #8a8d91)', cursor: 'pointer' }}
          >
            {t.terms}
          </button>
          <button
            onClick={() => onNavigate('/privacy')}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #8a8d91)', cursor: 'pointer' }}
          >
            {t.privacy}
          </button>
          <span>VoiceCart India © 2026</span>
        </div>
      </footer>
    </div>
  );
};
