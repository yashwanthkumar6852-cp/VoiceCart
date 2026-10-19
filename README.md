# 🎙️ VoiceCart — Multi-Store AI Voice Shopping Assistant

> **Production-grade voice-controlled shopping comparison app comparing live products across Amazon India, Flipkart, and Meesho.**

---

## 🌟 System Overview & Architecture

VoiceCart empowers users to speak natural voice shopping queries (e.g. *"Find me the best wireless earbuds under 2000 rupees"*, or in Hindi *"2000 रुपये के अंदर सबसे अच्छे ईयरबड्स दिखाओ"*, or Tamil *"2000 ரூபாய்க்குள் சிறந்த இயர்பட்ஸ் காட்டு"*).

The system performs:
1. **Speech-to-Text & Intent Slot Parsing** (Product, Brand, Max Budget, Preference).
2. **Parallel Live API Fetching** across Amazon India (PA-API 5.0) and Flipkart Affiliate API with Meesho Partner Adapter.
3. **Multi-Factor Explainable Ranking Algorithm** (0–100 composite score based on Bayesian-weighted ratings, price, delivery speed, and return policies).
4. **Side-by-Side 3-Store Comparison Matrix**.
5. **Real-time Cart & Live Price Re-Verification**.
6. **Official Store Deep-Link Purchasing & SMS/Email Order Timeline Tracking**.

```mermaid
graph TD
    User(["👤 User Voice / Text Query"]) --> Frontend["📱 VoiceCart Web/Mobile Client"]
    Frontend -->|"Web Speech / Audio Stream"| VoiceEngine["🗣️ STT & Voice Feedback"]
    Frontend -->|"POST /api/voice/process"| Backend["⚙️ VoiceCart Express Backend"]
    
    Backend --> IntentParser["🧠 Multilingual Intent & Slot Parser"]
    IntentParser --> Aggregator["⚡ Parallel Store Aggregator"]
    
    Aggregator -->|"AWS SigV4 PA-API 5.0"| AmazonAPI["🟠 Amazon India PA-API 5.0"]
    Aggregator -->|"Affiliate REST API"| FlipkartAPI["🔵 Flipkart Affiliate API"]
    Aggregator -->|"Partner Feed Adapter"| MeeshoAPI["🌸 Meesho Partner Feed"]
    
    AmazonAPI --> Cache[("⚡ Redis Cache / Memory")]
    FlipkartAPI --> Cache
    MeeshoAPI --> Cache
    
    Cache --> RankingEngine["📊 Explainable Ranking Algorithm"]
    RankingEngine --> ScoreCalc["🧮 Score 0-100: Price 35%, Rating 25%, Quality 20%, Value 10%, Speed 10%"]
    ScoreCalc --> Badges["🏷️ Best Overall, Lowest Price, Fastest Delivery"]
    
    Badges --> Frontend
    Frontend --> Cart["🛒 Cart & Live Price Re-Verification"]
    Cart --> AffiliateDeepLink["🔗 Official Merchant Checkout Link - Amazon, Flipkart, Meesho"]
    Cart --> DemoGateway["💳 VoiceCart Built-in Demo Payment Gateway"]
    
    Frontend --> OrderTracker["📦 SMS/Email Order ID Parser & Store Tracking"]
```

---

## 🚀 Key Features

- **Push-to-Talk Voice Interface**: Live audio waveform visualization, multilingual support (English, Hindi, Tamil) with real-time speech recognition and text-to-speech spoken summaries.
- **Strict Real Data Compliance**: Zero mock or fake product data. Uses official signed AWS SigV4 Amazon PA-API 5.0 and Flipkart Affiliate API.
- **Compliant Meesho Adapter**: Strictly avoids web scraping. If partner credentials are not configured, cleanly reports *"Meesho: Partner API Required"* in the UI.
- **Explainable Ranking**: Dynamic scoring model weighting Price (35%), Bayesian-smoothed ratings (25%), Quality signals (20%), Value per unit (10%), and Delivery speed (10%).
- **Cross-Store Comparison Matrix**: Live price, shipping fee, delivery timeline, and return policy comparison across Amazon, Flipkart, and Meesho.
- **Cart with Live Price Re-Verification**: Re-queries the live store APIs before checkout to alert users if prices have dropped or increased.
- **SMS / Email Confirmation Order Tracker**: Automatically extracts Store and Order IDs from confirmation texts (e.g. Amazon `402-1234567-8901234`, Flipkart `OD1234567890`) and generates direct links to official store tracking pages.
- **Built-in Demo Payment Gateway (College Presentation)**: Fully local, zero-external-call payment simulation supporting UPI, Cards (Luhn validation & OTP screen), Netbanking, Wallets, and COD with floating Demo Control Panel.

---

## 💳 Payment Architecture (Demo)

VoiceCart features an enterprise-style, self-contained **Demo Payment Gateway** built specifically for demonstration and evaluation without requiring external merchant accounts, live banking keys, or charging real money.

### Payment Flow Diagram

```mermaid
flowchart LR
    Cart["🛒 Cart"] -->|"1. Pay Now Clicked"| CreateOrder["📝 Server: Create Order<br/>POST /api/payments/create"]
    CreateOrder -->|"2. order_DEMO_xxxxxx"| PaymentPage["💳 Payment Gateway Modal<br/>UPI / Cards / Netbanking / Wallets / COD"]
    PaymentPage -->|"3. User Authorizes"| Confirm["⚡ Server: Confirm Payment<br/>POST /api/payments/confirm"]
    Confirm -->|"4. pay_DEMO_xxxxxx"| Status["🔄 Server: Poll Status<br/>GET /api/payments/:orderId/status"]
    Status -->|"5. Verified State"| Receipt["🧾 Result Screen & Download PDF Receipt"]
```

### 1. Payment Methods Supported
- **UPI Simulation**:
  - Dynamic QR code generation for demo UPI deep-links: `upi://pay?pa=demo@voicecart&pn=VoiceCart&am=<amount>&cu=INR&tn=<orderId>`.
  - Realistic App Launchers: Google Pay, PhonePe, Paytm, and BHIM simulation with interactive numeric PIN pad (accepts any 4/6-digit PIN).
  - Custom UPI ID validation (e.g. `user@okhdfcbank`).
- **Cards (Credit / Debit)**:
  - Card number, cardholder name, expiry date (MM/YY), and CVV input.
  - Client & Server-side **Luhn algorithm** verification.
  - Test Success Card: `4111 1111 1111 1111` (or any valid Visa/Mastercard Luhn card).
  - Test Failure Card: `4000 0000 0000 0002` (triggers bank decline simulation).
  - 3D Secure OTP verification overlay (OTP `123456` succeeds; invalid attempts lock after 3 tries).
- **Netbanking**:
  - Interactive selection of top Indian banks (HDFC, SBI, ICICI, Axis, Kotak, PNB).
  - Simulated bank login modal with instant 1-click authorization.
- **Wallets**:
  - Instant balance simulation for Paytm, PhonePe, and Amazon Pay.
- **Cash on Delivery (COD)**:
  - Instant order confirmation with status `PENDING_PAYMENT`.

### 2. Floating Demo Control Panel (For Live Presentations)
- Click **"Demo Controls"** inside the checkout modal to toggle test conditions on the fly:
  - **Outcome**: `SUCCESS`, `FAILURE`, or `PENDING`.
  - **Processing Latency**: Adjustable simulated network delay (1s to 5s).
- Demonstrates resilient UI handling for success confirmation ticks, bank error recovery, and auto-refreshing pending polling states.

### 3. Server-Side Security & Invoicing
- **Zero Client Trust**: Total payment amount is strictly calculated and validated on the backend from cart items before creating `order_DEMO_xxxxxx`.
- **Idempotency**: Prevents double-charging or duplicate confirmations on the same order.
- **Invoice & Receipt PDF Download**: Generates branded, printable PDF receipts with itemized pricing, taxes, timestamps, and demo watermark.
- **Partner Store Isolation**: Items from Amazon, Flipkart, and Meesho retain deep links to official merchant apps and are never charged locally.

---

## 🌐 Free Online Hosting & Deployment Guide

VoiceCart is fully configured for 100% free online hosting on mobile and desktop:
- **Frontend**: [Vercel](https://vercel.com) (Static Vite SPA with same-origin `/api` rewrites).
- **Backend**: [Render](https://render.com) (Free Web Service on Node 20 with dynamic port binding, health check, and rate limiting).
- **Database**: [Neon](https://neon.tech) / [Supabase](https://supabase.com) (Serverless PostgreSQL database connected via `DATABASE_URL`).

```mermaid
graph LR
    Client["📱 Mobile & Desktop User<br/>https://voicecart.vercel.app"] -->|"Same-Origin Request"| Vercel["⚡ Vercel Edge SPA"]
    Vercel -->|"Rewrite /api/(.*)"| Render["🚀 Render Web Service<br/>https://voicecart-backend.onrender.com"]
    Render -->|"Persistent Pool"| Postgres[("🐘 Neon / Supabase PostgreSQL")]
    Render -->|"Live Shopping API"| SerpApi["🔍 SerpApi Google Shopping India"]
    Render -->|"Speech Recognition"| Sarvam["🎙️ Sarvam AI / Groq Whisper"]
```

---

### 1. Step 1: Database Setup (Neon or Supabase — 2 mins)
1. Go to **[neon.tech](https://neon.tech)** (or Supabase) and create a free project named `voicecart`.
2. Copy your PostgreSQL Connection String (`DATABASE_URL`), which looks like:
   ```text
   postgresql://username:password@ep-sample-123.ap-southeast-1.aws.neon.tech/voicecart?sslmode=require
   ```
*(No manual table creation is needed: VoiceCart executes `npm run migrate:deploy` automatically on every deployment).*

---

### 2. Step 2: Backend Deployment on Render (3 mins)
1. Fork or push this repository to your **GitHub** account.
2. Log in to **[render.com](https://render.com)** and click **New +** &rarr; **Web Service**.
3. Connect your GitHub repository.
4. Fill in the following settings (or let `render.yaml` configure it automatically):
   - **Name**: `voicecart-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run migrate:deploy && npm start`
   - **Health Check Path**: `/health`
5. Under **Environment Variables**, add:
   | Variable | Value / Description | Required? |
   |---|---|---|
   | `NODE_ENV` | `production` | **Yes** |
   | `DATABASE_URL` | Your Neon / Supabase connection string | **Yes (Fails fast in prod if missing)** |
   | `JWT_SECRET` | Any strong 32+ character random string | **Yes** |
   | `CORS_ORIGIN` | `https://<your-vercel-app>.vercel.app` | **Yes** |
   | `APP_URL` | `https://<your-vercel-app>.vercel.app` | **Yes** |
   | `SERPAPI_KEY` | Your SerpApi API key (100 free searches/mo) | Optional (for live search) |
   | `SARVAM_API_KEY` | Your Sarvam AI key (Indic speech STT) | Optional (for Indic voice) |
   | `GROQ_API_KEY` | Your Groq API key (Whisper STT & LLM) | Optional (for AI voice) |
   | `GEMINI_API_KEY` | Your Google Gemini API key | Optional |
   | `REDIS_URL` | (Leave empty to use PostgreSQL persistent database cache) | Optional |
6. Click **Create Web Service**. Note down your Render backend URL (e.g. `https://voicecart-backend.onrender.com`).

---

### 3. Step 3: Frontend Deployment on Vercel (2 mins)
1. Log in to **[vercel.com](https://vercel.com)** and click **Add New...** &rarr; **Project**.
2. Select your GitHub repository.
3. In **Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` (or `./` if deploying from repo root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**:
   | Variable | Value | Description |
   |---|---|---|
   | `VITE_API_URL` | `/api` (or `https://voicecart-backend.onrender.com/api`) | Same-origin proxying |
5. Update `vercel.json` destination with your Render URL:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "https://<your-render-backend>.onrender.com/api/$1" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
6. Click **Deploy**.

---

### 4. Step 4: Post-Deploy Warm Cache (1-Click)
Render's free web service spins down after 15 minutes of inactivity. To ensure initial visitors get sub-second responses without consuming quota on popular searches, run the post-deploy cache warming script:
```bash
# In backend directory (or via Render Shell tab):
npm run warm-cache
```
This pre-caches trending categories and frequent searches (`boAt earbuds`, `iPhone`, `wireless headphones`) directly into the PostgreSQL database cache.

---

### 5. 📱 Mobile Readiness & PWA Installation
- **Add to Home Screen**: Includes `manifest.webmanifest` and a lightweight app-shell service worker (`sw.js`) that caches only UI assets and never stores private auth or search data.
- **Microphone on Mobile**: Requires HTTPS (automatically provided by Vercel/Render). Built-in fallback audio recorder is active for iOS Safari where native `webkitSpeechRecognition` is unsupported.
- **Responsive Breakpoints**: Verified on iPhone SE (360px), iPhone 14 Pro (390px), iPad Mini (768px), and 4K displays with 44px+ touch targets and no horizontal scrollbars.

---

### 6. 🛠️ Troubleshooting & FAQs

#### Q1: "Connecting to cloud backend... Waking up free instance" appears on the frontend?
> **Normal behavior**: On Render's free tier, the instance goes to sleep after 15 minutes of idle time. The first request takes 30–50 seconds to boot. VoiceCart's frontend automatically displays a friendly status pill and retries failed requests up to 3 times without erroring out.

#### Q2: 404 Not Found when refreshing deep links like `/orders/123` or `/login`?
> **Cause**: The static server does not have the SPA fallback rewrite configured.
> **Fix**: Verify `vercel.json` exists in your deployment root with `{ "source": "/(.*)", "destination": "/index.html" }`.

#### Q3: CORS or Cookie authentication issue between Vercel and Render?
> **Fix**: Ensure `CORS_ORIGIN` in Render environment variables matches your exact Vercel domain (e.g. `https://voicecart.vercel.app`), and use `/api` same-origin rewrites in `vercel.json` to bypass 3rd-party cookie blocking on iOS Safari.

#### Q4: Microphone button blocked or inactive?
> **Cause**: Browsers restrict microphone access to secure `https://` contexts or localhost only.
> **Fix**: Ensure you open the application over `https://`. In iOS Safari, tap the **AA** menu &rarr; **Website Settings** &rarr; **Microphone: Allow**.

#### Q5: Browser console shows warnings from contentscript.js or ObjectMultiplex?
> **Note**: Console warnings from contentscript.js (MaxListenersExceededWarning, ObjectMultiplex) come from browser extensions, not from VoiceCart. Use an Incognito window or a clean Chrome profile for demos.

---

## 📋 Compliant Alternatives for Non-Official Features

| Feature | Non-Official / Prohibited Method | VoiceCart's Compliant Alternative |
|---|---|---|
| **Meesho Product Feed** | HTML scraping / headless browser scraping | Strict partner interface (`MeeshoProvider`). If no partner API credentials exist in `.env`, displays *"Meesho: Partner API Required"* in UI without fake data. |
| **Store Checkout** | Automated login / credit card filling scraping | Official Affiliate Deep Linking. Directs users safely to Amazon/Flipkart mobile apps or web pages where users authenticate with their own credentials. |
| **Order Status Tracking** | Scraping user's private store login accounts | Safe SMS / Email confirmation text parser with direct official store tracking links (`amazon.in/gp/your-account/order-details`, `flipkart.com/account/orders`). |

---

## 💡 Notes on Browser Extensions & Demo Environments

> [!NOTE]
> Console warnings from contentscript.js (MaxListenersExceededWarning, ObjectMultiplex) come from browser extensions, not from VoiceCart. Use an Incognito window or a clean Chrome profile for demos.



