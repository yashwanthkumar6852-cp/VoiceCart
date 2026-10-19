export type PreferredLanguage = 'en' | 'hi' | 'kn';
export type AppTheme = 'light' | 'dark' | 'system';
export type ShoppingPreference = 'balanced' | 'cheapest' | 'best_rated' | 'fastest';

export interface UserAccountProfile {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  firstName: string;
  surname: string;
  dob?: string;
  gender?: 'Female' | 'Male' | 'Custom' | 'Prefer not to say' | string;
  preferredLanguage: PreferredLanguage;
  avatarUrl?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
  memberSinceFormatted?: string;
  preferences: {
    language: PreferredLanguage;
    theme: AppTheme;
    preference: ShoppingPreference;
    preferredStores: string[];
    notifications: {
      orderUpdates: boolean;
      priceDrops: boolean;
      promo: boolean;
    };
    voice: {
      voiceReplies: boolean;
      language: PreferredLanguage;
      speed: number;
      pitch: number;
      preferredVoice?: string;
    };
  };
}

export interface UserAddress {
  id: string;
  userId: string;
  fullName: string;
  mobile: string;
  pincode: string;
  houseStreet: string;
  area: string;
  city: string;
  state: string;
  addressType: 'home' | 'work' | 'other';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedPaymentMethod {
  id: string;
  userId: string;
  type: 'upi' | 'card' | 'wallet';
  label: string;
  details: {
    upiId?: string;
    cardBrand?: string;
    last4?: string;
    expiry?: string;
    cardHolder?: string;
    walletName?: string;
    walletPhone?: string;
  };
  isDefault: boolean;
  createdAt: string;
}

export interface LoginActivity {
  id: string;
  userId: string;
  timestamp: string;
  ip: string;
  browser: string;
  device: string;
  location: string;
  isCurrentDevice: boolean;
}

export interface AccountStats {
  totalOrders: number;
  itemsInCart: number;
  savedAddressesCount: number;
  totalAmountComparedOrSaved: number;
}

export interface FullAccountSummary {
  success: boolean;
  profile: UserAccountProfile;
  stats: AccountStats;
  addresses: UserAddress[];
  savedPaymentMethods: SavedPaymentMethod[];
  recentActivity: LoginActivity[];
}
