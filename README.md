# OrangeSync Architecture & Implementation Walkthrough

Welcome to **OrangeSync**, a production-ready, highly secure, cross-platform collaborative video calling platform! We have successfully transformed your request into a fully architected Monorepo powering both Web and Native Mobile applications.

## 🚀 What We Accomplished

### 1. Robust Architecture (Turborepo)
We built a unified monorepo containing `apps/web` (Next.js 15 PWA) and `apps/mobile` (React Native Expo). Packages and routing run through highly optimized bundlers using Turbopack and Metro with workspace hoisting. The entire ecosystem adopts your custom beautiful Orange aesthetic!

### 2. Bulletproof Security (Supabase & Biometrics)
- **Supabase SSR:** Integrated secure cookie-based session management across the web dashboard.
- **Hardware Bindings:** The Mobile App uses `expo-secure-store` to encrypt tokens directly into the iOS/Android Keychain and uses `expo-local-authentication` to enforce **FaceID / Fingerprint** unlocking.
- **Secure WebRTC Tokens:** Wrote a Next.js Edge API to generate highly secure LiveKit Access Tokens, dynamically handling both Web Cookie Auth and Mobile Bearer Auth natively!

### 3. Real-Time Communication 🎥
- Implemented **LiveKit Cloud SFU** (Selective Forwarding Unit) to handle high-bandwidth video routing effortlessly on the free tier.
- Users optionally enter a `SYNC-ID` Room ID to securely join 1-on-1 or Group calls natively from Desktop or Mobile with Camera & Mic toggles.

### 4. Advanced Collaborative Syncing 🎨
- Utilizing WebRTC **Data Channels**, we built custom components that sync application state peer-to-peer with zero latency!
- **Interactive Whiteboard:** Draw, Erase, and Undo synchronously across all connected users in real-time.
- **Watch Together:** Paste a YouTube URL and have Play/Pause/Seek events seamlessly synchronized globally across all dashboards.

### 5. Deployment Pipelines (CI/CD)
We designed Enterprise-grade deployment logic:
- [eas.json](file:///C:/Users/bhuwa/Desktop/AI%20Learning%20and%20projects/MyVideoCall/OrangeSync/apps/mobile/eas.json) configures OTA (Over-The-Air) updates and standalone `.apk`/`.app` builds via Expo Application Services.
- GitHub Actions workflows automatically build the Next.js app to Vercel and the Mobile app to EAS effortlessly upon pushing to `main`.

---

## 📱 How to Run and Build Locally

### Testing the Web Application
1. Copy API keys from Supabase & LiveKit into `.env.local`.
2. Run `npm run dev` in the root (or `npm run dev --prefix apps/web`).
3. Load [localhost:3000](http://localhost:3000)

### Compiling the Physical Mobile Application
Because the `@livekit/react-native` plugin hooks intensely into the device's native C++ WebRTC binaries, the Expo Go testing app does not support it. We must compile it!
1. `cd apps/mobile`
2. Run `npx expo prebuild` (to generate iOS/Android native core folders based on your `app.json`)
3. Install the app on an emulator/device:
   - For Android: `npx expo run:android` (Requires Android Studio)
   - For iOS: `npx expo run:ios` (Requires Xcode on a Mac)
   - For EAS Cloud Build: `eas build --profile development --platform android`
