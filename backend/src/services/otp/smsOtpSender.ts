import axios from 'axios';
import { config } from '../../config';
import { OtpSender, OtpSendResult } from './otpSender';

export class SmsOtpSender implements OtpSender {
  public readonly channelName = 'sms' as const;

  public isAvailable(): boolean {
    return Boolean(config.sms.isEnabled || config.presenterMode);
  }

  public async sendOtp(recipient: string, otp: string, metadata?: Record<string, any>): Promise<OtpSendResult> {
    const cleanPhone = recipient.replace(/\D/g, '').slice(-10);

    // Standard Web OTP formatted text
    const domain = metadata?.domain || 'voicecart.app';
    const webOtpMessage = `<#> Your VoiceCart verification code is ${otp}\n@${domain} #${otp}`;

    // If real SMS provider is configured with keys in .env
    if (config.sms.isEnabled) {
      try {
        if (config.sms.provider.toLowerCase() === 'fast2sms') {
          await axios.post(
            'https://www.fast2sms.com/dev/bulkV2',
            {
              route: 'otp',
              variables_values: otp,
              numbers: cleanPhone,
              message: webOtpMessage
            },
            {
              headers: {
                authorization: config.sms.apiKey
              },
              timeout: 8000
            }
          );
        } else {
          console.log(`[VoiceCart SMS] Sending SMS via ${config.sms.provider} to +91 ${cleanPhone}: "${webOtpMessage}"`);
        }

        return {
          success: true,
          message: `Verification code sent to +91 ${cleanPhone}`,
          isAvailable: true
        };
      } catch (err: any) {
        console.error('❌ [VoiceCart] Failed to send SMS OTP via provider:', err.message);
        if (!config.presenterMode) {
          return {
            success: false,
            message: 'Mobile OTP delivery failed. Please try again or use email.',
            error: err.message,
            isAvailable: true
          };
        }
      }
    }

    // In Presenter mode or Dev simulated mode (for local testing / presentations without paid SMS gateway)
    if (config.presenterMode || !config.sms.isEnabled) {
      console.log(`[VoiceCart OTP] 📱 SMS OTP for +91 ${cleanPhone}: ${otp} (Web OTP msg: "${webOtpMessage.replace('\n', ' ')}")`);
      return {
        success: true,
        message: `Verification code sent to +91 ${cleanPhone}`,
        isAvailable: true
      };
    }

    // When real SMS provider is not configured in production
    return {
      success: false,
      message: 'Mobile OTP is not available right now. Please use email.',
      error: 'SMS_PROVIDER_NOT_CONFIGURED',
      isAvailable: false
    };
  }
}

export const smsOtpSender = new SmsOtpSender();
