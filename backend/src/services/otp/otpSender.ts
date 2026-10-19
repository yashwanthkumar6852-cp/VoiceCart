export interface OtpSendResult {
  success: boolean;
  message: string;
  error?: string;
  isAvailable: boolean;
}

export interface OtpSender {
  readonly channelName: 'email' | 'sms';
  isAvailable(): boolean;
  sendOtp(recipient: string, otp: string, metadata?: Record<string, any>): Promise<OtpSendResult>;
}
