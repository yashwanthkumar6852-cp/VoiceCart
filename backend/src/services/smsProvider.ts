/**
 * Pluggable SMS Provider interface.
 * Defaults to DemoConsoleSmsProvider, but can be swapped with Twilio, Gupshup, Fast2SMS, etc.
 */
export interface SmsProvider {
  sendOtp(phoneNumber: string, otp: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export class DemoConsoleSmsProvider implements SmsProvider {
  public async sendOtp(phoneNumber: string, otp: string): Promise<{ success: boolean; messageId?: string }> {
    console.log(`\n======================================================`);
    console.log(`📱 [DEMO SMS GATEWAY]`);
    console.log(`To      : +91 ${phoneNumber}`);
    console.log(`Message : Your VoiceCart login verification code is ${otp}. Valid for 5 minutes.`);
    console.log(`======================================================\n`);
    return { success: true, messageId: `msg_${Date.now()}` };
  }
}
