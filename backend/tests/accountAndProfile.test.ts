import { accountService } from '../src/services/accountService';
import { dbClient } from '../src/db/dbClient';
import { requireAuth, AuthenticatedRequest } from '../src/middleware/auth';
import { Response } from 'express';

describe('Profile & Account Service and User Isolation', () => {
  const userA = {
    id: 'usr_test_account_a',
    email: 'yashwanth@voicecart.in',
    role: 'authenticated',
    user_metadata: { full_name: 'Yashwanth Kumar', phone: '9876543210' }
  };

  const userB = {
    id: 'usr_test_account_b',
    email: 'ananya@voicecart.in',
    role: 'authenticated',
    user_metadata: { full_name: 'Ananya Sharma', phone: '9876543211' }
  };

  beforeAll(async () => {
    await dbClient.deleteUserAccount(userA.id);
    await dbClient.deleteUserAccount(userB.id);
  });

  describe('Full Account Summary & Computed Stats', () => {
    it('creates profile on demand with real defaults and computed stats', async () => {
      const summaryA = await accountService.getFullAccountSummary(userA);
      expect(summaryA.profile).toBeDefined();
      expect(summaryA.profile.id).toBe(userA.id);
      expect(summaryA.profile.fullName).toBe('Yashwanth Kumar');
      expect(summaryA.stats.totalOrders).toBe(0);
      expect(summaryA.stats.itemsInCart).toBe(0);
      expect(summaryA.addresses.length).toBeGreaterThanOrEqual(1);
      expect(summaryA.savedPaymentMethods.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Profile Update', () => {
    it('updates personal details and preferences for User A', async () => {
      const updated = await accountService.updateProfile(userA.id, {
        firstName: 'Yashwanth',
        surname: 'Kumar',
        dob: '1998-05-15',
        gender: 'Male',
        preferredLanguage: 'kn'
      });

      expect(updated.firstName).toBe('Yashwanth');
      expect(updated.preferredLanguage).toBe('kn');
      expect(updated.gender).toBe('Male');
    });
  });

  describe('Address Management', () => {
    let createdAddressId = '';

    it('adds a new delivery address with PIN code', async () => {
      const address = await accountService.addAddress(userA.id, {
        fullName: 'Yashwanth K',
        mobile: '9876543210',
        pincode: '560038',
        houseStreet: '#42, 12th Cross, HAL 2nd Stage',
        area: 'Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        addressType: 'work',
        isDefault: false
      });

      expect(address.id).toBeDefined();
      expect(address.pincode).toBe('560038');
      createdAddressId = address.id;
    });

    it('sets address as default', async () => {
      const updated = await accountService.setDefaultAddress(userA.id, createdAddressId);
      expect(updated).not.toBeNull();
      expect(updated?.isDefault).toBe(true);
    });

    it('deletes address successfully', async () => {
      const success = await accountService.deleteAddress(userA.id, createdAddressId);
      expect(success).toBe(true);
    });
  });

  describe('Payment Methods Management', () => {
    let createdMethodId = '';

    it('adds demo payment method', async () => {
      const method = await accountService.addPaymentMethod(userA.id, {
        type: 'upi',
        label: 'Paytm UPI',
        details: { upiId: 'yashwanth@paytm' },
        isDefault: false
      });

      expect(method.id).toBeDefined();
      expect(method.details.upiId).toBe('yashwanth@paytm');
      createdMethodId = method.id;
    });

    it('deletes demo payment method', async () => {
      const success = await accountService.deletePaymentMethod(userA.id, createdMethodId);
      expect(success).toBe(true);
    });
  });

  describe('Data Export and Account Deletion', () => {
    it('exports all user data as structured JSON', async () => {
      const exportData = await accountService.exportUserData(userA.id);
      expect(exportData.platform).toBe('VoiceCart India');
      expect(exportData.profile).toBeDefined();
      expect(exportData.profile.id).toBe(userA.id);
    });
  });

  describe('Strict Cross-User Isolation', () => {
    it('User B cannot see User A profile data, addresses or payment methods', async () => {
      const summaryB = await accountService.getFullAccountSummary(userB);
      expect(summaryB.profile.id).toBe(userB.id);
      expect(summaryB.profile.id).not.toBe(userA.id);

      const addressesB = await accountService.getAddresses(userB.id);
      const addressesA = await accountService.getAddresses(userA.id);

      expect(addressesB.every((b) => b.userId === userB.id)).toBe(true);
      expect(addressesA.every((a) => a.userId === userA.id)).toBe(true);
    });
  });

  describe('RequireAuth Middleware Protection', () => {
    it('blocks unauthenticated requests with 401', async () => {
      const mockReq = {
        headers: {}
      } as AuthenticatedRequest;

      let statusCode = 0;
      let jsonPayload: any = null;

      const mockRes = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (data: any) => {
              jsonPayload = data;
              return mockRes;
            }
          };
        }
      } as unknown as Response;

      const mockNext = jest.fn();

      await requireAuth(mockReq, mockRes, mockNext);

      expect(statusCode).toBe(401);
      expect(jsonPayload.error).toMatch(/Unauthorized/i);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
