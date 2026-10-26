import crypto from 'crypto';
import { config } from '../config';

export interface CreateOrderParams {
  amountInInr: number;
  receiptId?: string;
  notes?: Record<string, string>;
}

export interface ConfirmPaymentParams {
  orderId: string;
  method: string;
  amount?: number;
  demoResult?: 'SUCCESS' | 'FAILED' | 'PENDING';
  failureReason?: string;
  paymentDetails?: any;
}

export class DemoPaymentService {
  constructor() {
    console.log('✅ VoiceCart Built-in DEMO Payment Gateway Initialized (No External Gateway).');
  }

  public generatePaymentSignature(paymentId: string, orderId: string, amount: number = 0): string {
    const payload = `${orderId}|${paymentId}|${amount}`;
    return crypto.createHmac('sha256', config.jwtSecret).update(payload).digest('hex');
  }

  public verifyPaymentSignature(paymentId: string, orderId: string, amount: number, signature: string): boolean {
    if (!signature) return false;
    const expected = this.generatePaymentSignature(paymentId, orderId, amount);
    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }

  public getConfig() {
    return {
      isConfigured: true,
      isDemo: true,
      name: config.demoPayment.name,
      currency: config.demoPayment.currency,
      upiId: config.upi.id || '8660318787@ibl',
      upiPayeeName: config.upi.payeeName || 'VoiceCart',
      supportedMethods: ['COD', 'UPI', 'QR', 'WALLET', 'CARD', 'NETBANKING']
    };
  }

  /**
   * Luhn Algorithm implementation to validate 16-digit credit/debit card numbers
   */
  public validateLuhn(cardNumber: string): boolean {
    const sanitized = cardNumber.replace(/\D/g, '');
    if (sanitized.length < 13 || sanitized.length > 19) {
      return false;
    }

    let sum = 0;
    let shouldDouble = false;

    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized.charAt(i), 10);

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }

  /**
   * Create a local demo payment order
   */
  public async createOrder(amountInInr: number, receiptId?: string, notes: Record<string, string> = {}) {
    const amountInPaise = Math.round(amountInInr * 100);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `order_vc_${Date.now().toString().slice(-6)}_${randomSuffix}`;
    const receipt = receiptId || `vc_rcpt_${Date.now()}`;

    return {
      id: orderId,
      amount: amountInPaise,
      amountInr: amountInInr,
      currency: 'INR',
      receipt,
      status: 'created',
      createdAt: new Date().toISOString(),
      notes
    };
  }

  /**
   * Process simulated payment confirmation for all 6 methods:
   * 'cod' | 'upi' | 'qr' | 'wallet' | 'card' | 'netbanking'
   */
  public async processPaymentConfirmation(params: ConfirmPaymentParams) {
    const { orderId, method, demoResult = 'SUCCESS', failureReason } = params;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const paymentId = `pay_vc_${Date.now().toString().slice(-6)}_${randomSuffix}`;
    const timestamp = new Date().toISOString();

    const normalizedMethod = (method || '').toLowerCase();
    const isCod = normalizedMethod === 'cod' || normalizedMethod.includes('cash on delivery');

    let finalStatus: 'PAID' | 'FAILED' | 'PENDING' | 'cod_pending' = 'PAID';
    let message = 'Payment authorized and captured successfully.';

    if (demoResult === 'FAILED') {
      finalStatus = 'FAILED';
      message = failureReason || 'Payment declined by issuing bank. Please try another card or payment method.';
    } else if (demoResult === 'PENDING') {
      finalStatus = 'PENDING';
      message = 'Payment pending authorization from issuing bank.';
    } else if (isCod) {
      finalStatus = 'cod_pending';
      message = 'Order placed successfully with Cash on Delivery. Pending payment upon delivery.';
    }

    // Standard method display formatting
    let methodDisplay = method;
    if (normalizedMethod === 'cod') methodDisplay = 'Cash on Delivery (COD)';
    else if (normalizedMethod === 'upi') methodDisplay = 'UPI';
    else if (normalizedMethod === 'qr') methodDisplay = 'UPI QR Code';
    else if (normalizedMethod === 'wallet') methodDisplay = 'Digital Wallet';
    else if (normalizedMethod === 'card') methodDisplay = 'Debit / Credit Card';
    else if (normalizedMethod === 'netbanking') methodDisplay = 'Netbanking';

    const signature = this.generatePaymentSignature(paymentId, orderId, params.amount || 0);

    return {
      paymentId,
      orderId,
      status: finalStatus,
      method: methodDisplay,
      methodCode: method,
      paidAt: timestamp,
      signature,
      message,
      isSuccess: finalStatus === 'PAID' || finalStatus === 'cod_pending'
    };
  }
}

export const demoPaymentService = new DemoPaymentService();
