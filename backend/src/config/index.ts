import dotenv from 'dotenv';
import path from 'path';

// Load .env from workspace root or current directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  appUrl: process.env.APP_URL || process.env.VITE_APP_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Redis & Database
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  redisTtlSeconds: parseInt(process.env.REDIS_TTL_SECONDS || '300', 10), // 5 min cache
  databaseUrl: process.env.DATABASE_URL || '',

  // Authentication & Security
  jwtSecret: process.env.JWT_SECRET || 'voicecart_production_jwt_secret_key_2026_secure',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  demoPassword: process.env.DEMO_PASSWORD || 'Demo@VoiceCart2026!',
  authGenericErrors: process.env.AUTH_GENERIC_ERRORS === 'true',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',

  // SerpApi (Live Google Shopping India for Amazon, Flipkart, Meesho)
  serpApiKey: process.env.SERPAPI_KEY || '',

  // Apify Token
  apifyToken: process.env.APIFY_TOKEN || '',

  // Amazon PA-API 5.0 & Creators Tag
  amazon: {
    accessKey: process.env.AMAZON_ACCESS_KEY || '',
    secretKey: process.env.AMAZON_SECRET_KEY || '',
    partnerTag: process.env.AMAZON_PARTNER_TAG || process.env.AMAZON_ASSOCIATE_TAG || 'voxacart-21',
    clientId: process.env.AMAZON_CLIENT_ID || '',
    clientSecret: process.env.AMAZON_CLIENT_SECRET || '',
    host: 'webservices.amazon.in',
    region: 'eu-west-1',
    marketplace: 'www.amazon.in',
    isEnabled: Boolean(process.env.AMAZON_ACCESS_KEY || process.env.SERPAPI_KEY)
  },

  // Flipkart Affiliate API
  flipkart: {
    affiliateId: process.env.FLIPKART_AFFILIATE_ID || '',
    affiliateToken: process.env.FLIPKART_AFFILIATE_TOKEN || '',
    baseUrl: 'https://affiliate-api.flipkart.net/affiliate/1.0',
    isEnabled: Boolean((process.env.FLIPKART_AFFILIATE_ID && process.env.FLIPKART_AFFILIATE_TOKEN) || process.env.SERPAPI_KEY)
  },

  // Meesho Partner & Apify Feed
  meesho: {
    partnerApiKey: process.env.MEESHO_PARTNER_API_KEY || process.env.APIFY_TOKEN || '',
    partnerEndpoint: process.env.MEESHO_PARTNER_ENDPOINT || process.env.MEESHO_FEED_URL || '',
    isEnabled: Boolean(process.env.MEESHO_PARTNER_API_KEY || process.env.MEESHO_FEED_URL || process.env.SERPAPI_KEY || process.env.APIFY_TOKEN)
  },

  // LLM Intent Parser & Voice Transcription Pipeline
  sarvamApiKey: process.env.SARVAM_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  googleSpeechApiKey: process.env.GOOGLE_SPEECH_API_KEY || '',

  speechProviders: {
    sarvam: Boolean(process.env.SARVAM_API_KEY),
    groq: Boolean(process.env.GROQ_API_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    webSpeech: true
  },

  // Presenter Mode (for local/testing overrides - enabled when PRESENTER_MODE is true or in development)
  presenterMode: process.env.PRESENTER_MODE === 'true' || (process.env.NODE_ENV !== 'production' && process.env.PRESENTER_MODE !== 'false'),

  // Real Email SMTP Provider (Brevo, Resend, Gmail App Password, etc.)
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'VoiceCart Security <no-reply@voicecart.app>',
    isEnabled: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  },

  // Real SMS Provider (Fast2SMS, Twilio, MSG91, etc.)
  sms: {
    provider: process.env.SMS_PROVIDER || '',
    apiKey: process.env.SMS_API_KEY || '',
    senderId: process.env.SMS_SENDER_ID || '',
    isEnabled: Boolean(process.env.SMS_PROVIDER && process.env.SMS_API_KEY)
  },

  // VoiceCart Pay Gateway (simulated checkout)
  demoPayment: {
    isEnabled: true,
    name: 'VoiceCart Pay Gateway',
    currency: 'INR'
  },

  // Direct UPI Configuration
  upi: {
    id: process.env.UPI_ID || '8660318787@ibl',
    payeeName: process.env.UPI_PAYEE_NAME || 'VoiceCart'
  }
};
