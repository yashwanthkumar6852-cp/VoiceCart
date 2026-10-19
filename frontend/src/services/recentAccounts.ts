/**
 * Client-Side Recent Accounts Manager (Non-Sensitive Only)
 * Stores maximum 3 accounts in localStorage:
 * - userId
 * - displayName
 * - avatarInitial
 * - maskedIdentifier (e.g. y***@gmail.com or +91 98****21)
 * - method: 'email' | 'mobile'
 * - lastLoginAt: ISOString
 *
 * NEVER stores passwords, OTPs, tokens or full identifiers.
 */

export interface RecentAccount {
  userId: string;
  displayName: string;
  avatarInitial: string;
  maskedIdentifier: string;
  method: 'email' | 'mobile';
  lastLoginAt: string;
}

const STORAGE_KEY = 'voicecart_recent_accounts';
const MAX_ACCOUNTS = 3;
const MAX_AGE_DAYS = 30;

export function maskIdentifier(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.includes('@')) {
    const [local, domain] = trimmed.split('@');
    if (!local || !domain) return trimmed;
    const visible = local.length > 2 ? local[0] + '***' : local[0] + '***';
    return `${visible}@${domain}`;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length >= 10) {
    const last10 = digits.slice(-10);
    return `+91 ${last10.slice(0, 2)}****${last10.slice(-2)}`;
  }
  return trimmed;
}

export function formatRelativeTime(isoString: string): string {
  try {
    const past = new Date(isoString).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, now - past);
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return 'just now';
    if (diffMin === 1) return '1 minute ago';
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    return 'recently';
  } catch {
    return 'recently';
  }
}

export const recentAccountsManager = {
  getRecentAccounts(): RecentAccount[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: RecentAccount[] = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
      return parsed
        .filter((acc) => acc && acc.userId && new Date(acc.lastLoginAt).getTime() >= cutoff)
        .slice(0, MAX_ACCOUNTS);
    } catch {
      return [];
    }
  },

  saveRecentAccount(account: Omit<RecentAccount, 'lastLoginAt'>): void {
    try {
      const existing = this.getRecentAccounts();
      const updatedList: RecentAccount[] = [
        {
          userId: account.userId,
          displayName: account.displayName || 'Shopper',
          avatarInitial: account.avatarInitial || (account.displayName ? account.displayName[0].toUpperCase() : 'U'),
          maskedIdentifier: account.maskedIdentifier,
          method: account.method,
          lastLoginAt: new Date().toISOString()
        },
        ...existing.filter((acc) => acc.userId !== account.userId)
      ].slice(0, MAX_ACCOUNTS);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (err) {
      console.warn('Failed to save recent account:', err);
    }
  },

  removeRecentAccount(userId: string): void {
    try {
      const existing = this.getRecentAccounts();
      const filtered = existing.filter((acc) => acc.userId !== userId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (err) {
      console.warn('Failed to remove recent account:', err);
    }
  },

  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
};
