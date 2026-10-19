import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw, Lock, Globe, ArrowRight } from 'lucide-react';
import { SupportedLanguage } from '../i18n/translations';

interface Props {
  onNavigate: (path: string) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  pendingNotice?: string | null;
}

export const SignupPage: React.FC<Props> = ({
  onNavigate,
  language,
  onLanguageChange,
  pendingNotice
}) => {
  const {
    isAuthenticated,
    signUp,
    sendOtp,
    verifyOtp,
    toggleDemoMode
  } = useAuth();

  // If already logged in, redirect home
  useEffect(() => {
    if (isAuthenticated) {
      onNavigate('/');
    }
  }, [isAuthenticated, onNavigate]);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [identifier, setIdentifier] = useState(''); // Email or 10-digit phone
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Date of Birth
  const [birthDay, setBirthDay] = useState('1');
  const [birthMonth, setBirthMonth] = useState('1');
  const [birthYear, setBirthYear] = useState('2000');

  // Gender & Language
  const [gender, setGender] = useState<'female' | 'male' | 'custom' | ''>('');
  const [preferredLang, setPreferredLang] = useState<string>(language === 'auto' ? 'en' : language);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Phone OTP sub-state (if signing up via mobile number)
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [demoOtpNotice, setDemoOtpNotice] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);

  // Presenter simulation mode (hidden behind Ctrl+Shift+P or ?presenter=1)
  const [isPresenter, setIsPresenter] = useState(() => {
    return (
      (typeof window !== 'undefined' && window.location.search.includes('presenter=1')) ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('voicecart_presenter_mode') === 'true')
    );
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
        setIsPresenter((prev) => {
          const next = !prev;
          localStorage.setItem('voicecart_presenter_mode', String(next));
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[a-zA-Z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score; // 0 to 4
  };

  const pwdStrength = getPasswordStrength(password);

  // Age Validation (must be >= 13 years old)
  const calculateAge = (d: number, m: number, y: number) => {
    const today = new Date();
    const birthDate = new Date(y, m - 1, d);
    let age = today.getFullYear() - birthDate.getFullYear();
    const mDiff = today.getMonth() - birthDate.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Translations
  const i18n = {
    en: {
      heading: 'Create a new account',
      subheading: "It's quick and easy.",
      firstName: 'First name',
      surname: 'Surname',
      identifier: 'Mobile number or email address',
      newPassword: 'New password',
      dobLabel: 'Date of birth',
      genderLabel: 'Gender',
      female: 'Female',
      male: 'Male',
      custom: 'Custom',
      langLabel: 'Preferred Language',
      termsAgreement: 'I agree to the Terms of Service and Privacy Policy.',
      signUpBtn: 'Sign Up',
      alreadyAccount: 'Already have an account?',
      verifyOtpHeading: 'Verify your mobile number',
      otpSubheading: (num: string) => `Enter the 6-digit code sent to +91 ${num}`,
      changeNumber: 'Change number',
      resendIn: (s: number) => `Resend code in ${s}s`,
      resendNow: 'Resend Code',
      verifyBtn: 'Verify & Complete Account',
      duplicateNotice: 'This email or mobile number is already registered.',
      loginInstead: 'Log in instead',
      successWelcome: (name: string) => `Welcome to VoiceCart, ${name}! Redirecting...`
    },
    hi: {
      heading: 'नया खाता बनाएं',
      subheading: 'यह त्वरित और आसान है।',
      firstName: 'पहला नाम',
      surname: 'उपनाम',
      identifier: 'मोबाइल नंबर या ईमेल पता',
      newPassword: 'नया पासवर्ड',
      dobLabel: 'जन्म तिथि',
      genderLabel: 'लिंग',
      female: 'महिला',
      male: 'पुरुष',
      custom: 'कस्टम',
      langLabel: 'पसंदीदा भाषा',
      termsAgreement: 'मैं सेवा की शर्तों और गोपनीयता नीति से सहमत हूँ।',
      signUpBtn: 'साइन अप करें',
      alreadyAccount: 'पहले से एक खाता है?',
      verifyOtpHeading: 'मोबाइल नंबर सत्यापित करें',
      otpSubheading: (num: string) => `+91 ${num} पर भेजा गया 6 अंकों का कोड दर्ज करें`,
      changeNumber: 'नंबर बदलें',
      resendIn: (s: number) => `${s}s में पुनः भेजें`,
      resendNow: 'कोड दोबारा भेजें',
      verifyBtn: 'सत्यापित करें और पूरा करें',
      duplicateNotice: 'यह ईमेल या मोबाइल नंबर पहले से पंजीकृत है।',
      loginInstead: 'लॉग इन करें',
      successWelcome: (name: string) => `वॉइसकार्ट में आपका स्वागत है, ${name}!`
    },
    kn: {
      heading: 'ಹೊಸ ಖಾತೆ ರಚಿಸಿ',
      subheading: 'ಇದು ಸುಲಭ ಮತ್ತು ತ್ವರಿತವಾಗಿದೆ.',
      firstName: 'ಹೆಸರು',
      surname: 'ಉಪನಾಮ',
      identifier: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಅಥವಾ ಇಮೇಲ್',
      newPassword: 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್',
      dobLabel: 'ಹುಟ್ಟಿದ ದಿನಾಂಕ',
      genderLabel: 'ಲಿಂಗ',
      female: 'ಮಹಿಳೆ',
      male: 'ಪುರುಷ',
      custom: 'ಇತರೆ',
      langLabel: 'ಆದ್ಯತೆಯ ಭಾಷೆ',
      termsAgreement: 'ನಾನು ನಿಯಮಗಳು ಮತ್ತು ಗೌಪ್ಯತಾ ನೀತಿಗೆ ಒಪ್ಪುತ್ತೇನೆ.',
      signUpBtn: 'ಸೈನ್ ಅಪ್ ಮಾಡಿ',
      alreadyAccount: 'ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?',
      verifyOtpHeading: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಪರಿಶೀಲಿಸಿ',
      otpSubheading: (num: string) => `+91 ${num} ಗೆ ಕಳುಹಿಸಲಾದ 6 ಅಂಕಿಗಳ ಒಟಿಪಿ ನಮೂದಿಸಿ`,
      changeNumber: 'ಸಂಖ್ಯೆ ಬದಲಾಯಿಸಿ',
      resendIn: (s: number) => `${s}s ನಲ್ಲಿ ಮರುಕಳುಹಿಸಿ`,
      resendNow: 'ಮತ್ತೆ ಕೋಡ್ ಕಳುಹಿಸಿ',
      verifyBtn: 'ದೃಢೀಕರಿಸಿ ಖಾತೆ ಪೂರ್ಣಗೊಳಿಸಿ',
      duplicateNotice: 'ಈ ಇಮೇಲ್ ಅಥವಾ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲ್ಪಟ್ಟಿದೆ.',
      loginInstead: 'ಬದಲಿಗೆ ಲಾಗ್ ಇನ್ ಮಾಡಿ',
      successWelcome: (name: string) => `ವಾಯ್ಸ್‌ಕಾರ್ಟ್‌ಗೆ ಸ್ವಾಗತ, ${name}!`
    }
  };

  const t = i18n[language === 'auto' ? 'en' : language] || i18n.en;

  // Countdown timer for OTP
  useEffect(() => {
    let interval: any = null;
    if (isOtpStep && resendTimer > 0) {
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
  }, [isOtpStep, resendTimer]);

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsDuplicate(false);

    if (!firstName.trim()) {
      setErrorMsg('Please enter your first name.');
      return;
    }

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setErrorMsg('Please enter a mobile number or email.');
      return;
    }

    // Password validation: minimum 8 characters, one letter, one number
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      setErrorMsg('Password must contain at least one letter and one number.');
      return;
    }

    // Age validation: >= 13 years old
    const age = calculateAge(parseInt(birthDay, 10), parseInt(birthMonth, 10), parseInt(birthYear, 10));
    if (age < 13) {
      setErrorMsg('You must be at least 13 years old to create a VoiceCart account.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    const isMobile = /^[6-9]\d{9}$/.test(cleanInput.replace(/\D/g, '').slice(-10));
    const fullName = `${firstName.trim()} ${surname.trim()}`.trim();

    if (isMobile) {
      // OTP verification (Email or Mobile)
      setLoading(true);
      try {
        const res = await sendOtp(cleanInput);
        if (res.success) {
          setIsOtpStep(true);
          setResendTimer(res.resendCooldownSeconds || 30);
          setCanResend(false);
          if (res.demoOtp) {
            setDemoOtpNotice(res.demoOtp);
          }
          setTimeout(() => {
            otpInputRefs.current[0]?.focus();
          }, 150);
        } else {
          setErrorMsg(res.error || 'Failed to send verification code.');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error communicating with server.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Email Registration
    setLoading(true);
    try {
      const res = await signUp({
        email: cleanInput,
        password,
        fullName
      });

      if (res.error) {
        if (res.error.toLowerCase().includes('already registered') || res.error.toLowerCase().includes('duplicate')) {
          setIsDuplicate(true);
          setErrorMsg(t.duplicateNotice);
        } else {
          setErrorMsg(res.error);
        }
      } else {
        setSuccessMsg(t.successWelcome(firstName));
        setTimeout(() => onNavigate('/'), 1800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Signup failed.');
    } finally {
      setLoading(false);
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

  const submitOtpVerification = async (enteredOtp: string) => {
    setErrorMsg(null);
    setLoading(true);

    const cleanId = identifier.trim();
    const fullName = `${firstName.trim()} ${surname.trim()}`.trim();
    try {
      const res = await verifyOtp(cleanId, enteredOtp, fullName, preferredLang);
      if (res.success) {
        setSuccessMsg(t.successWelcome(firstName));
        setTimeout(() => onNavigate('/'), 1200);
      } else {
        setErrorMsg(res.error || 'Invalid verification code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Generate Year Options (1920 to 2026)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear; y >= 1920; y--) {
    yearOptions.push(y);
  }

  const handleDemoLogin = () => {
    toggleDemoMode(true);
    setSuccessMsg('Logged in as Demo User (Yashwanth Kumar)!');
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
      {/* Top VoiceCart Header Logo */}
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div
          onClick={() => onNavigate('/')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1877f2, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(24, 119, 242, 0.35)'
            }}
          >
            <Sparkles size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1877f2', margin: 0 }}>
            Voice<span style={{ color: '#06b6d4' }}>Cart</span>
          </h1>
        </div>
      </div>

      {/* Main Centered Facebook-Style Card */}
      <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>
        {pendingNotice && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: 'var(--accent-gold, #d97706)',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={16} />
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
          {/* Card Title & Subtitle */}
          <div style={{ borderBottom: '1px solid var(--border-color, #dadde1)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-main, #1c1e21)' }}>
              {t.heading}
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #65676b)', margin: 0 }}>
              {t.subheading}
            </p>
          </div>

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
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
              {isDuplicate && (
                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  style={{
                    background: '#1877f2',
                    color: '#fff',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {t.loginInstead}
                </button>
              )}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {!isOtpStep ? (
            /* SIGNUP FORM */
            <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Name Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input
                  type="text"
                  required
                  autoFocus
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t.firstName}
                  style={{
                    padding: '12px 14px',
                    fontSize: '0.95rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #ccd0d5)',
                    background: 'var(--bg-input, #f5f6f7)',
                    color: 'var(--text-main, #1c1e21)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder={t.surname}
                  style={{
                    padding: '12px 14px',
                    fontSize: '0.95rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #ccd0d5)',
                    background: 'var(--bg-input, #f5f6f7)',
                    color: 'var(--text-main, #1c1e21)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Mobile / Email */}
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t.identifier}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '0.95rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #ccd0d5)',
                  background: 'var(--bg-input, #f5f6f7)',
                  color: 'var(--text-main, #1c1e21)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />

              {/* Password */}
              <div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.newPassword}
                    style={{
                      width: '100%',
                      padding: '12px 42px 12px 14px',
                      fontSize: '0.95rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #ccd0d5)',
                      background: 'var(--bg-input, #f5f6f7)',
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
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ display: 'flex', gap: '4px', height: '4px', marginBottom: '4px' }}>
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          style={{
                            flex: 1,
                            borderRadius: '2px',
                            background:
                              pwdStrength >= step
                                ? pwdStrength === 4
                                  ? '#10b981'
                                  : pwdStrength >= 3
                                  ? '#3b82f6'
                                  : pwdStrength === 2
                                  ? '#f59e0b'
                                  : '#ef4444'
                                : 'var(--border-color, #e4e6eb)'
                          }}
                        />
                      ))}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #8a8d91)' }}>
                      Must have at least 8 characters with letters & numbers.
                    </div>
                  </div>
                )}
              </div>

              {/* Date of Birth Dropdowns */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #65676b)', marginBottom: '4px' }}>
                  {t.dobLabel}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1.2fr', gap: '8px' }}>
                  <select
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #ccd0d5)',
                      background: 'var(--bg-input, #ffffff)',
                      color: 'var(--text-main, #1c1e21)',
                      fontSize: '0.9rem'
                    }}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #ccd0d5)',
                      background: 'var(--bg-input, #ffffff)',
                      color: 'var(--text-main, #1c1e21)',
                      fontSize: '0.9rem'
                    }}
                  >
                    {[
                      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                    ].map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>{m}</option>
                    ))}
                  </select>

                  <select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #ccd0d5)',
                      background: 'var(--bg-input, #ffffff)',
                      color: 'var(--text-main, #1c1e21)',
                      fontSize: '0.9rem'
                    }}
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Gender Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary, #65676b)', marginBottom: '4px' }}>
                  {t.genderLabel}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { id: 'female', label: t.female },
                    { id: 'male', label: t.male },
                    { id: 'custom', label: t.custom }
                  ].map((g) => (
                    <label
                      key={g.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color, #ccd0d5)',
                        background: 'var(--bg-input, #ffffff)',
                        color: 'var(--text-main, #1c1e21)',
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      <span>{g.label}</span>
                      <input
                        type="radio"
                        name="gender"
                        value={g.id}
                        checked={gender === g.id}
                        onChange={() => setGender(g.id as any)}
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Preferred Language & Terms */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary, #65676b)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    required
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    style={{ marginTop: '2px' }}
                  />
                  <span>
                    By signing up, you agree to our{' '}
                    <span onClick={(e) => { e.preventDefault(); onNavigate('/terms'); }} style={{ color: '#1877f2', textDecoration: 'underline' }}>
                      Terms
                    </span>{' '}
                    and{' '}
                    <span onClick={(e) => { e.preventDefault(); onNavigate('/privacy'); }} style={{ color: '#1877f2', textDecoration: 'underline' }}>
                      Privacy Policy
                    </span>.
                  </span>
                </label>
              </div>

              {/* Submit Button (Green) */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: '#00a400',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(0, 164, 0, 0.35)',
                  marginTop: '6px'
                }}
              >
                {loading ? <RefreshCw size={20} className="mic-active-pulse" /> : t.signUpBtn}
              </button>

              {/* Already have an account link & Demo Login */}
              <div style={{ textAlign: 'center', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#1877f2',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {t.alreadyAccount}
                </button>

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
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    marginTop: '4px'
                  }}
                >
                  <span>⚡ 1-Click Demo Login</span>
                </button>
              </div>
            </form>
          ) : (
            /* OTP VERIFICATION FOR MOBILE SIGNUP */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    {t.verifyOtpHeading}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    {t.otpSubheading(identifier)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOtpStep(false)}
                  style={{ background: 'transparent', border: 'none', color: '#1877f2', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {t.changeNumber}
                </button>
              </div>

              {/* Presenter OTP Banner */}
              {isPresenter && demoOtpNotice && (
                <div
                  style={{
                    background: 'rgba(24, 119, 242, 0.1)',
                    border: '1px solid rgba(24, 119, 242, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.82rem',
                    color: '#1877f2'
                  }}
                >
                  <span>Presenter OTP: <strong>{demoOtpNotice}</strong></span>
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
                      padding: '4px 10px',
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

              {/* Hidden Input with autocomplete="one-time-code" for Mobile Keyboards */}
              <input
                type="text"
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otpValues.join('')}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                  const newValues = ['', '', '', '', '', ''];
                  for (let i = 0; i < digits.length; i++) {
                    newValues[i] = digits[i];
                  }
                  setOtpValues(newValues);
                  if (digits.length === 6) {
                    submitOtpVerification(digits);
                  }
                }}
                style={{
                  position: 'absolute',
                  opacity: 0,
                  pointerEvents: 'none',
                  width: '1px',
                  height: '1px'
                }}
              />

              {/* 6 OTP Inputs */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }} onPaste={handleOtpPaste}>
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
                      outline: 'none'
                    }}
                  />
                ))}
              </div>

              {/* Resend Action */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span>Didn't receive SMS?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleSignupSubmit}
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
                  background: '#00a400',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {loading ? <RefreshCw size={18} className="mic-active-pulse" /> : t.verifyBtn}
              </button>
            </div>
          )}
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
            Terms
          </button>
          <button
            onClick={() => onNavigate('/privacy')}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #8a8d91)', cursor: 'pointer' }}
          >
            Privacy
          </button>
          <span>VoiceCart India © 2026</span>
        </div>
      </footer>
    </div>
  );
};
