import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  X,
  Phone,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Edit3,
  TrendingDown,
  Mic,
  PackageCheck,
  LogOut,
  SlidersHorizontal,
  KeyRound
} from 'lucide-react';
import { SupportedLanguage } from '../../i18n/translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup' | 'profile';
  language?: SupportedLanguage;
  pendingNotice?: string | null;
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
  language = 'en',
  pendingNotice
}) => {
  const {
    user,
    profile,
    isAuthenticated,
    sendOtp,
    verifyOtp,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    isConfigured,
    toggleDemoMode,
    pendingAction,
    executePendingAction
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'phone' | 'email'>('phone');
  const [emailMode, setEmailMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  // Phone OTP state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpStep, setOtpStep] = useState<'enter_phone' | 'enter_otp' | 'new_user_name'>('enter_phone');
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [demoOtpNotice, setDemoOtpNotice] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState('');

  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Status state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Translations dictionary for Meesho-style flow
  const i18n = {
    en: {
      heading: 'Sign up or Log in',
      subheading: 'Enter your details to continue shopping',
      phoneTab: 'Mobile number',
      emailTab: 'Email ID',
      phonePlaceholder: 'Enter 10 digit mobile number',
      continueBtn: 'Continue',
      verifyOtpHeading: 'Enter Verification Code',
      otpSubheading: (phone: string) => `We sent a 6-digit code to +91 ${phone}`,
      changeNumber: 'Change number',
      resendIn: (s: number) => `Resend code in ${s}s`,
      resendNow: 'Resend Code',
      demoOtpNotice: (otp: string) => `Demo OTP: ${otp} (Instant Verification)`,
      verifyBtn: 'Verify & Continue',
      nameHeading: 'What should we call you?',
      nameSubheading: 'Enter your full name to personalize your account',
      namePlaceholder: 'e.g. Yashwanth Kumar',
      finishSignupBtn: 'Complete Profile',
      emailPlaceholder: 'name@example.com',
      passwordPlaceholder: 'Enter your password',
      confirmPasswordPlaceholder: 'Confirm password',
      forgotPassword: 'Forgot password?',
      signInBtn: 'Sign In',
      signUpBtn: 'Create Account',
      newHere: 'New to VoiceCart? Sign up',
      alreadyUser: 'Already have an account? Sign in',
      googleBtn: 'Continue with Google',
      demoLoginBtn: '⚡ Quick 1-Click Demo Login',
      termsText: 'By continuing, you agree to our Terms & Privacy Policy',
      benefitsTitle: 'Why shop with VoiceCart?',
      benefit1: 'Compare Amazon, Flipkart & Meesho live prices',
      benefit2: 'Shop hands-free with voice in Kannada, Hindi & English',
      benefit3: 'Single-click demo checkout with real-time order tracking',
      profileTitle: 'My Account',
      profileSub: 'Manage your VoiceCart account & demo settings',
      signOutBtn: 'Log Out',
      continueShopping: 'Continue Shopping',
    },
    hi: {
      heading: 'लॉग इन या साइन अप करें',
      subheading: 'खरीदारी जारी रखने के लिए विवरण दर्ज करें',
      phoneTab: 'मोबाइल नंबर',
      emailTab: 'ईमेल',
      phonePlaceholder: '10 अंकों का मोबाइल नंबर डालें',
      continueBtn: 'आगे बढ़ें',
      verifyOtpHeading: 'ओटीपी सत्यापन कोड डालें',
      otpSubheading: (phone: string) => `हमने +91 ${phone} पर 6 अंकों का कोड भेजा है`,
      changeNumber: 'नंबर बदलें',
      resendIn: (s: number) => `${s}s में पुनः भेजें`,
      resendNow: 'कोड दोबारा भेजें',
      demoOtpNotice: (otp: string) => `डेमो ओटीपी: ${otp} (त्वरित सत्यापन)`,
      verifyBtn: 'सत्यापित करें और आगे बढ़ें',
      nameHeading: 'आपका नाम क्या है?',
      nameSubheading: 'खाता सेट करने के लिए अपना पूरा नाम दर्ज करें',
      namePlaceholder: 'उदा. यशवंत कुमार',
      finishSignupBtn: 'प्रोफ़ाइल पूरी करें',
      emailPlaceholder: 'name@example.com',
      passwordPlaceholder: 'पासवर्ड डालें',
      confirmPasswordPlaceholder: 'पासवर्ड की पुष्टि करें',
      forgotPassword: 'पासवर्ड भूल गए?',
      signInBtn: 'लॉग इन करें',
      signUpBtn: 'खाता बनाएं',
      newHere: 'वॉइसकार्ट पर नए हैं? साइन अप करें',
      alreadyUser: 'पहले से खाता है? लॉग इन करें',
      googleBtn: 'गूगल से जारी रखें',
      demoLoginBtn: '⚡ त्वरित 1-क्लिक डेमो लॉगिन',
      termsText: 'आगे बढ़कर, आप हमारी सेवा की शर्तों और गोपनीयता नीति से सहमत होते हैं',
      benefitsTitle: 'वॉइसकार्ट ही क्यों?',
      benefit1: 'अमेज़न, फ्लिपकार्ट और मीशो की लाइव कीमतों की तुलना',
      benefit2: 'कन्नड़, हिन्दी और अंग्रेज़ी में वॉइस से हैंड्स-फ़्री खरीदारी',
      benefit3: 'त्वरित डेमो चेकआउट और रीयल-टाइम ऑर्डर ट्रैकिंग',
      profileTitle: 'मेरा खाता',
      profileSub: 'खाता सेटिंग्स और सुरक्षा प्रबंधित करें',
      signOutBtn: 'लॉग आउट',
      continueShopping: 'खरीदारी जारी रखें',
    },
    kn: {
      heading: 'ಸೈನ್ ಅಪ್ ಅಥವಾ ಲಾಗ್ ಇನ್ ಮಾಡಿ',
      subheading: 'ಶಾಪಿಂಗ್ ಮುಂದುವರಿಸಲು ನಿಮ್ಮ ವಿವರ ನಮೂದಿಸಿ',
      phoneTab: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
      emailTab: 'ಇಮೇಲ್',
      phonePlaceholder: '10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ',
      continueBtn: 'ಮುಂದುವರಿಯಿರಿ',
      verifyOtpHeading: 'ದೃಢೀಕರಣ ಕೋಡ್ ನಮೂದಿಸಿ',
      otpSubheading: (phone: string) => `ನಾವು +91 ${phone} ಗೆ 6 ಅಂಕಿಗಳ ಕೋಡ್ ಕಳುಹಿಸಿದ್ದೇವೆ`,
      changeNumber: 'ಸಂಖ್ಯೆ ಬದಲಾಯಿಸಿ',
      resendIn: (s: number) => `${s}s ನಲ್ಲಿ ಮರುಕಳುಹಿಸಿ`,
      resendNow: 'ಮತ್ತೆ ಕೋಡ್ ಕಳುಹಿಸಿ',
      demoOtpNotice: (otp: string) => `ಡೆಮೊ ಒಟಿಪಿ: ${otp} (ತ್ವರಿತ ದೃಢೀಕರಣ)`,
      verifyBtn: 'ದೃಢೀಕರಿಸಿ ಮುಂದುವರಿಯಿರಿ',
      nameHeading: 'ನಿಮ್ಮ ಹೆಸರೇನು?',
      nameSubheading: 'ಖಾತೆ ಪೂರ್ಣಗೊಳಿಸಲು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು ನಮೂದಿಸಿ',
      namePlaceholder: 'ಉದಾ: ಯಶವಂತ ಕುಮಾರ್',
      finishSignupBtn: 'ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ',
      emailPlaceholder: 'name@example.com',
      passwordPlaceholder: 'ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ',
      confirmPasswordPlaceholder: 'ಪಾಸ್‌ವರ್ಡ್ ಖಚಿತಪಡಿಸಿ',
      forgotPassword: 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?',
      signInBtn: 'ಲಾಗಿನ್ ಮಾಡಿ',
      signUpBtn: 'ಖಾತೆ ರಚಿಸಿ',
      newHere: 'ಹೊಸಬರೇ? ಸೈನ್ ಅಪ್ ಮಾಡಿ',
      alreadyUser: 'ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ? ಲಾಗಿನ್ ಮಾಡಿ',
      googleBtn: 'ಗೂಗಲ್ ಮೂಲಕ ಮುಂದುವರಿಯಿರಿ',
      demoLoginBtn: '⚡ ತ್ವರಿತ 1-ಕ್ಲಿಕ್ ಡೆಮೊ ಲಾಗಿನ್',
      termsText: 'ಮುಂದುವರಿಯುವ ಮೂಲಕ, ನೀವು ನಮ್ಮ ನಿಯಮಗಳು ಮತ್ತು ನೀತಿಗೆ ಒಪ್ಪುತ್ತೀರಿ',
      benefitsTitle: 'ವಾಯ್ಸ್‌ಕಾರ್ಟ್ ಏಕೆ?',
      benefit1: 'ಅಮೆಜಾನ್, ಫ್ಲಿಪ್‌ಕಾರ್ಟ್ & ಮೀಶೋ ಬೆಲೆಗಳ ನೈಜ-ಸಮಯ ಹೋಲಿಕೆ',
      benefit2: 'ಕನ್ನಡ, ಹಿಂದಿ & ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಧ್ವನಿಯ ಮೂಲಕ ಶಾಪಿಂಗ್',
      benefit3: 'ತ್ವರಿತ ಡೆಮೊ ಚೆಕ್‌ಔಟ್ & ನೇರ ಆರ್ಡರ್ ಟ್ರ್ಯಾಕಿಂಗ್',
      profileTitle: 'ನನ್ನ ಖಾತೆ',
      profileSub: 'ಖಾತೆ ನಿರ್ವಹಣೆ & ವಿವರಗಳು',
      signOutBtn: 'ಲಾಗ್ ಔಟ್',
      continueShopping: 'ಶಾಪಿಂಗ್ ಮುಂದುವರಿಸಿ',
    }
  };

  const effectiveLang = language === 'auto' ? 'en' : language;
  const text = i18n[effectiveLang] || i18n.en;

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setOtpStep('enter_phone');
      setOtpValues(['', '', '', '', '', '']);
      setDemoOtpNotice(null);
      if (defaultMode === 'signup') {
        setActiveTab('email');
        setEmailMode('signup');
      } else {
        setActiveTab('phone');
        setEmailMode('signin');
      }
    }
  }, [isOpen, defaultMode]);

  // Resend Timer Countdown
  useEffect(() => {
    let interval: any = null;
    if (otpStep === 'enter_otp' && resendTimer > 0) {
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
  }, [otpStep, resendTimer]);

  if (!isOpen) return null;

  // --- Handlers ---

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(cleanPhone);
      if (res.success) {
        setOtpStep('enter_otp');
        setResendTimer(res.resendCooldownSeconds || 30);
        setCanResend(false);
        if (res.demoOtp) {
          setDemoOtpNotice(res.demoOtp);
        }
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 150);
      } else {
        setErrorMsg(res.error || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with server.');
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

    // Auto verify when 6th digit entered
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

    try {
      const res = await verifyOtp(phoneNumber, enteredOtp, customName || newUserName);
      if (res.success) {
        if (res.isNewUser && !customName && !newUserName) {
          // New user prompt for name
          setOtpStep('new_user_name');
          setLoading(false);
          return;
        }

        setSuccessMsg('Logged in successfully! Welcome to VoiceCart.');
        await executePendingAction();
        setTimeout(() => onClose(), 600);
      } else {
        setErrorMsg(res.error || 'Invalid OTP code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    await submitOtpVerification(otpValues.join(''), newUserName.trim());
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (emailMode === 'signin') {
        const res = await signIn(email, password);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg('Signed in successfully!');
          await executePendingAction();
          setTimeout(() => onClose(), 600);
        }
      } else if (emailMode === 'signup') {
        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match.');
          setLoading(false);
          return;
        }
        const res = await signUp({ email, password, fullName });
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg('Account created successfully!');
          await executePendingAction();
          setTimeout(() => onClose(), 600);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    toggleDemoMode(true);
    setSuccessMsg('Logged in as Demo User (Yashwanth Kumar)!');
    await executePendingAction();
    setTimeout(() => onClose(), 500);
  };

  const handleSignOut = async () => {
    await signOut();
    setSuccessMsg('Signed out successfully.');
    setTimeout(() => onClose(), 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      {/* Main Split Card (Meesho-Style) */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row text-slate-100 max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT COLUMN: Colorful Branding Banner with Value Propositions */}
        <div className="md:w-5/12 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-indigo-500/20">
          {/* Subtle Ambient Glowing Circles */}
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-purple-500/25 blur-3xl pointer-events-none" />

          <div>
            {/* Logo & Badge */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/40">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
                  VoiceCart
                </h1>
                <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">
                  Real-time Comparison
                </span>
              </div>
            </div>

            {/* Pending Action Notification Banner */}
            {pendingNotice && (
              <div className="mb-6 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{pendingNotice}</span>
              </div>
            )}

            {/* Benefits List */}
            <div className="space-y-4 my-4">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                {text.benefitsTitle}
              </p>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingDown className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {text.benefit1}
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Mic className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {text.benefit2}
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <PackageCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {text.benefit3}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-indigo-500/20">
            <p className="text-[11px] text-slate-400">
              Trusted for live price comparison across Amazon India, Flipkart & Meesho.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Form / Profile Screen */}
        <div className="md:w-7/12 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto bg-slate-900/95">
          {/* USER PROFILE SCREEN (If already authenticated) */}
          {isAuthenticated ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{text.profileTitle}</h2>
                <p className="text-xs text-slate-400 mt-1">{text.profileSub}</p>
              </div>

              {/* Profile Card */}
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                  {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold truncate">
                    {profile?.full_name || 'VoiceCart Member'}
                  </h3>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {profile?.email || (profile?.phone ? `+91 ${profile.phone}` : '')}
                  </p>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active & Verified
                  </span>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-700/50 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <LogOut className="w-4 h-4" /> {text.signOutBtn}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  {text.continueShopping}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Header Titles */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  {text.heading}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {text.subheading}
                </p>
              </div>

              {/* Status Alerts */}
              {errorMsg && (
                <div className="mb-4 p-3 rounded-2xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="mb-4 p-3 rounded-2xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Auth Mode Tabs (Mobile Number / Email) */}
              <div className="flex rounded-2xl bg-slate-800/80 p-1 mb-6 border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => { setActiveTab('phone'); setErrorMsg(null); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'phone'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" /> {text.phoneTab}
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('email'); setErrorMsg(null); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'email'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" /> {text.emailTab}
                </button>
              </div>

              {/* TAB 1: PHONE NUMBER & OTP FLOW */}
              {activeTab === 'phone' && (
                <div>
                  {/* Step A: Enter Phone Number */}
                  {otpStep === 'enter_phone' && (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          {text.phoneTab}
                        </label>
                        <div className="flex rounded-2xl bg-slate-800/90 border border-slate-700 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/30 overflow-hidden">
                          <div className="flex items-center gap-1.5 px-3.5 bg-slate-800 border-r border-slate-700 text-xs font-bold text-slate-200">
                            <span>🇮🇳</span>
                            <span>+91</span>
                          </div>
                          <input
                            type="tel"
                            required
                            autoFocus
                            maxLength={10}
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                            placeholder={text.phonePlaceholder}
                            className="w-full px-3.5 py-3 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-medium"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || phoneNumber.length < 10}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : text.continueBtn}
                        {!loading && <ArrowRight className="w-4 h-4" />}
                      </button>
                    </form>
                  )}

                  {/* Step B: 6-Digit OTP Boxes */}
                  {otpStep === 'enter_otp' && (
                    <div className="space-y-5 animate-fadeIn">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-bold text-white">{text.verifyOtpHeading}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">{text.otpSubheading(phoneNumber)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setOtpStep('enter_phone'); setDemoOtpNotice(null); }}
                          className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Edit3 className="w-3 h-3" /> {text.changeNumber}
                        </button>
                      </div>

                      {/* Demo OTP Notice Box */}
                      {demoOtpNotice && (
                        <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs flex items-center justify-between">
                          <span className="font-semibold">{text.demoOtpNotice(demoOtpNotice)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const digits = demoOtpNotice.split('');
                              setOtpValues(digits);
                              submitOtpVerification(demoOtpNotice);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px]"
                          >
                            Auto-Fill
                          </button>
                        </div>
                      )}

                      {/* 6 Digit Inputs */}
                      <div className="flex justify-between gap-2 on-otp-grid" onPaste={handleOtpPaste}>
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
                            className="w-11 h-13 sm:w-12 sm:h-14 rounded-2xl bg-slate-800 border-2 border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 text-center text-lg font-bold text-white transition-all focus:outline-none"
                          />
                        ))}
                      </div>

                      {/* Resend Action */}
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>Didn't receive the SMS?</span>
                        {canResend ? (
                          <button
                            type="button"
                            onClick={(e) => handleSendOtp(e)}
                            className="text-indigo-400 font-bold hover:underline"
                          >
                            {text.resendNow}
                          </button>
                        ) : (
                          <span className="text-slate-500 font-medium">
                            {text.resendIn(resendTimer)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={loading || otpValues.some((d) => d === '')}
                        onClick={() => submitOtpVerification(otpValues.join(''))}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : text.verifyBtn}
                      </button>
                    </div>
                  )}

                  {/* Step C: First-time New User Name Prompt */}
                  {otpStep === 'new_user_name' && (
                    <form onSubmit={handleFinishNewUser} className="space-y-4 animate-fadeIn">
                      <div>
                        <h3 className="text-sm font-bold text-white">{text.nameHeading}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{text.nameSubheading}</p>
                      </div>

                      <div>
                        <input
                          type="text"
                          required
                          autoFocus
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder={text.namePlaceholder}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading || !newUserName.trim()}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : text.finishSignupBtn}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 2: EMAIL AUTHENTICATION */}
              {activeTab === 'email' && (
                <form onSubmit={handleEmailAuth} className="space-y-3.5">
                  {emailMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Yashwanth Kumar"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email ID</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={text.emailPlaceholder}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-300">Password</label>
                      {emailMode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => setEmailMode('forgot')}
                          className="text-[11px] text-indigo-400 hover:underline"
                        >
                          {text.forgotPassword}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={text.passwordPlaceholder}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {emailMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={text.confirmPasswordPlaceholder}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : (emailMode === 'signin' ? text.signInBtn : text.signUpBtn)}
                  </button>

                  <div className="text-center pt-2">
                    {emailMode === 'signin' ? (
                      <button
                        type="button"
                        onClick={() => { setEmailMode('signup'); setErrorMsg(null); }}
                        className="text-xs text-indigo-400 font-semibold hover:underline"
                      >
                        {text.newHere}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setEmailMode('signin'); setErrorMsg(null); }}
                        className="text-xs text-indigo-400 font-semibold hover:underline"
                      >
                        {text.alreadyUser}
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* QUICK DEMO & SOCIAL LOGINS */}
              <div className="mt-6 pt-5 border-t border-slate-800 space-y-2.5">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-indigo-300 flex items-center justify-center gap-2 font-semibold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> {text.demoLoginBtn}
                </button>
              </div>

              {/* Terms Footer */}
              <p className="text-center text-[10px] text-slate-500 mt-4 leading-tight">
                {text.termsText}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
