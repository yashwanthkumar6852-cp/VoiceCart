import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../../config';
import { OtpSender, OtpSendResult } from './otpSender';

export class EmailOtpSender implements OtpSender {
  public readonly channelName = 'email' as const;
  private transporter: Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    if (config.smtp.isEnabled) {
      try {
        this.transporter = nodemailer.createTransport({
          host: config.smtp.host,
          port: config.smtp.port,
          secure: config.smtp.port === 465,
          auth: {
            user: config.smtp.user,
            pass: config.smtp.pass
          }
        });
      } catch (err: any) {
        console.warn(`⚠️ [VoiceCart] SMTP configuration warning: ${err.message}`);
        this.transporter = null;
      }
    }
  }

  public isAvailable(): boolean {
    return Boolean(config.smtp.isEnabled || config.presenterMode);
  }

  public async sendOtp(recipient: string, otp: string, metadata?: Record<string, any>): Promise<OtpSendResult> {
    const cleanEmail = recipient.trim().toLowerCase();

    const magicLink = metadata?.magicLinkUrl || '';
    const magicBtnHtml = magicLink ? `
      <div style="text-align: center; margin: 24px 0;">
        <a href="${magicLink}" style="background-color: #1877f2; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(24, 119, 242, 0.3);">
          ⚡ Verify and Sign In (1-Tap)
        </a>
      </div>
      <div style="text-align: center; font-size: 12px; color: #8a8d91; margin-bottom: 20px;">
        Or enter the 6-digit code above on your screen.
      </div>
    ` : '';

    // If SMTP transporter is configured, send real email
    if (this.transporter && config.smtp.isEnabled) {
      try {
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f9fc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .logo { font-size: 22px; font-weight: 800; color: #1877f2; letter-spacing: -0.5px; margin-bottom: 24px; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
    .desc { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
    .otp-box { background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 16px; }
    .otp-code { font-size: 36px; font-weight: 800; color: #15803d; letter-spacing: 8px; font-family: monospace; }
    .warning { font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">⚡ VoiceCart</div>
    <div class="title">Your Verification Code</div>
    <div class="desc">
      Use the 6-digit code below to verify your account and sign in to VoiceCart. This code is valid for <strong>5 minutes</strong>.
    </div>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
    </div>
    ${magicBtnHtml}
    <div class="warning">
      🔒 <strong>Security Tip:</strong> Never share this code or link with anyone. VoiceCart employees will never ask for your verification code.
    </div>
  </div>
</body>
</html>
        `;

        await this.transporter.sendMail({
          from: config.smtp.from,
          to: cleanEmail,
          subject: `${otp} is your VoiceCart verification code`,
          html,
          text: `Your VoiceCart verification code is ${otp}. Valid for 5 minutes.${magicLink ? ` Or sign in directly: ${magicLink}` : ''} Never share this code with anyone.`
        });

        return {
          success: true,
          message: `Verification code sent to ${cleanEmail}`,
          isAvailable: true
        };
      } catch (err: any) {
        console.error('❌ [VoiceCart] Failed to send email OTP via SMTP:', err.message);
        if (!config.presenterMode) {
          return {
            success: false,
            message: 'Unable to deliver email verification code. Please verify SMTP settings.',
            error: err.message,
            isAvailable: true
          };
        }
      }
    }

    // In Presenter mode or dev fallback (when SMTP keys not configured during offline/dev tests)
    console.log(`[VoiceCart OTP] 📧 Email OTP for ${cleanEmail}: ${otp}`);
    return {
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
      isAvailable: true
    };
  }
}

export const emailOtpSender = new EmailOtpSender();
