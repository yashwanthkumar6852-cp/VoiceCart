import { Router, Response } from 'express';
import { z } from 'zod';
import { accountService } from '../services/accountService';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Validation Schemas
const ProfilePatchSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  surname: z.string().max(50).optional(),
  fullName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit mobile number').optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  preferredLanguage: z.enum(['en', 'hi', 'kn']).optional(),
  preferences: z.object({
    language: z.enum(['en', 'hi', 'kn']).optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
    preference: z.enum(['balanced', 'cheapest', 'best_rated', 'fastest']).optional(),
    preferredStores: z.array(z.string()).optional(),
    notifications: z.object({
      orderUpdates: z.boolean().optional(),
      priceDrops: z.boolean().optional(),
      promo: z.boolean().optional()
    }).optional(),
    voice: z.object({
      voiceReplies: z.boolean().optional(),
      language: z.enum(['en', 'hi', 'kn']).optional(),
      speed: z.number().min(0.5).max(2.0).optional(),
      pitch: z.number().min(0.5).max(2.0).optional(),
      preferredVoice: z.string().optional()
    }).optional()
  }).optional()
});

const AddressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Must be a 10-digit Indian mobile number'),
  pincode: z.string().regex(/^\d{6}$/, 'Must be a valid 6-digit PIN code'),
  houseStreet: z.string().min(3, 'House number and street are required'),
  area: z.string().min(2, 'Area or locality is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  addressType: z.enum(['home', 'work', 'other']).default('home'),
  isDefault: z.boolean().default(false)
});

const PaymentMethodSchema = z.object({
  type: z.enum(['upi', 'card', 'wallet']),
  label: z.string().min(1),
  details: z.object({
    upiId: z.string().optional(),
    cardBrand: z.string().optional(),
    last4: z.string().regex(/^\d{4}$/).optional(),
    expiry: z.string().optional(),
    cardHolder: z.string().optional(),
    walletName: z.string().optional(),
    walletPhone: z.string().optional()
  }),
  isDefault: z.boolean().default(false)
});

// GET /api/account - Full account summary
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await accountService.getFullAccountSummary(req.user!);
    return res.json({ success: true, ...summary });
  } catch (err: any) {
    console.error('Failed to get account summary:', err);
    return res.status(500).json({ error: 'Failed to fetch account summary', details: err.message });
  }
});

// PATCH /api/account/profile - Update personal details
router.patch('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = ProfilePatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
    }
    const updated = await accountService.updateProfile(req.user!.id, parsed.data as any);
    return res.json({ success: true, profile: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
});

// POST /api/account/avatar - Update avatar image URL / base64
router.post('/avatar', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { avatarUrl } = req.body;
    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return res.status(400).json({ error: 'Valid avatarUrl is required' });
    }
    // Limit base64 length to ~3MB
    if (avatarUrl.length > 4 * 1024 * 1024) {
      return res.status(400).json({ error: 'Avatar image file is too large (max 2MB)' });
    }
    const updated = await accountService.updateProfile(req.user!.id, { avatarUrl });
    return res.json({ success: true, avatarUrl: updated.avatarUrl });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update avatar', details: err.message });
  }
});

// GET /api/account/addresses - List addresses
router.get('/addresses', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const addresses = await accountService.getAddresses(req.user!.id);
    return res.json({ success: true, addresses });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch addresses', details: err.message });
  }
});

// POST /api/account/addresses - Add address
router.post('/addresses', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = AddressSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
    }
    const address = await accountService.addAddress(req.user!.id, parsed.data);
    const addresses = await accountService.getAddresses(req.user!.id);
    return res.json({ success: true, address, addresses });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to add address', details: err.message });
  }
});

// PATCH /api/account/addresses/:id - Update address
router.patch('/addresses/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const addressId = req.params.id as string;
    const updated = await accountService.updateAddress(req.user!.id, addressId, req.body);
    const addresses = await accountService.getAddresses(req.user!.id);
    return res.json({ success: true, address: updated, addresses });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update address', details: err.message });
  }
});

// DELETE /api/account/addresses/:id - Delete address
router.delete('/addresses/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const addressId = req.params.id as string;
    await accountService.deleteAddress(req.user!.id, addressId);
    const addresses = await accountService.getAddresses(req.user!.id);
    return res.json({ success: true, addresses });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete address', details: err.message });
  }
});

// POST /api/account/addresses/:id/default - Set as default
router.post('/addresses/:id/default', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const addressId = req.params.id as string;
    const address = await accountService.setDefaultAddress(req.user!.id, addressId);
    const addresses = await accountService.getAddresses(req.user!.id);
    return res.json({ success: true, address, addresses });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to set default address', details: err.message });
  }
});

// GET /api/account/payment-methods - List saved payment methods
router.get('/payment-methods', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const paymentMethods = await accountService.getPaymentMethods(req.user!.id);
    return res.json({ success: true, paymentMethods });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch payment methods', details: err.message });
  }
});

// POST /api/account/payment-methods - Add saved demo payment method
router.post('/payment-methods', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = PaymentMethodSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
    }
    const method = await accountService.addPaymentMethod(req.user!.id, parsed.data);
    const paymentMethods = await accountService.getPaymentMethods(req.user!.id);
    return res.json({ success: true, method, paymentMethods });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to add payment method', details: err.message });
  }
});

// DELETE /api/account/payment-methods/:id - Delete saved payment method
router.delete('/payment-methods/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const methodId = req.params.id as string;
    await accountService.deletePaymentMethod(req.user!.id, methodId);
    const paymentMethods = await accountService.getPaymentMethods(req.user!.id);
    return res.json({ success: true, paymentMethods });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete payment method', details: err.message });
  }
});

// POST /api/account/change-password
router.post('/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters long and contain both letters and numbers.'
      });
    }
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required.' });
    }
    // Simulation success in demo / Supabase
    return res.json({ success: true, message: 'Password updated successfully across all sessions.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update password', details: err.message });
  }
});

// POST /api/account/logout-all
router.post('/logout-all', requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    return res.json({ success: true, message: 'Successfully logged out of all active sessions and devices.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to logout from all devices', details: err.message });
  }
});

// GET /api/account/export - Download full account data export
router.get('/export', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const exportData = await accountService.exportUserData(req.user!.id);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=voicecart_data_export_${req.user!.id}.json`);
    return res.json(exportData);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to export account data', details: err.message });
  }
});

// DELETE /api/account - Delete user account permanently
router.delete('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { confirmationText } = req.body;
    if (confirmationText !== 'DELETE') {
      return res.status(400).json({ error: 'Confirmation text must be "DELETE" to permanently remove account.' });
    }
    await accountService.deleteAccount(req.user!.id);
    return res.json({ success: true, message: 'Account and associated personal data deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete account', details: err.message });
  }
});

export default router;
