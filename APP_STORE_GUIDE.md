# GreenExpress Mobile App — App Store & Play Store Submission Guide

## What We Built

GreenExpress is now a Capacitor-wrapped native app for both **iOS** and **Android**. The existing
TanStack Start web application runs inside a native shell via Capacitor, with all API calls routed
to the live backend at `https://ef5d2c4ae9113753571b85ddf95ab4dd.ctonew.app`.

One codebase → two native apps.

## Project Structure

```
ios/
├── App/
│   ├── App/
│   │   ├── AppDelegate.swift          # App lifecycle
│   │   ├── Info.plist                 # Permissions + app config
│   │   ├── public/                    # ← Synced web assets
│   │   └── capacitor.config.json
│   └── App.xcodeproj/

android/
├── app/
│   └── src/main/
│       ├── AndroidManifest.xml        # Permissions + app config
│       ├── assets/public/             # ← Synced web assets
│       └── res/                       # Icons, strings, etc.

capacitor.config.ts                    # Source of truth for both platforms
scripts/capacitor-entry.js             # Post-build: generates index.html for Capacitor
```

## Build Pipeline

```bash
# iOS only:
bun run build:ios       # vite build → capacitor-entry → cap sync ios

# Android only:
bun run build:android   # vite build → capacitor-entry → cap sync android

# Both platforms at once:
bun run build:mobile    # vite build → capacitor-entry → cap sync (ios + android)
```

This runs:
1. `vite build` — builds the web app (client + SSR)
2. `scripts/capacitor-entry.js` — generates `dist/client/index.html` (Capacitor needs this; TanStack SSR doesn't produce it)
3. `npx cap sync` — copies web assets to each platform's native project

---

## Part 1: iOS App Store Submission

### Bundle ID
- **`com.greenexpress.delivery`**
- Must match `capacitor.config.ts` → `appId` and your App Store Connect registration.

### iOS Permissions (already configured in `ios/App/App/Info.plist`)

| Permission | Key | Purpose |
|-----------|-----|---------|
| Camera | `NSCameraUsageDescription` | Scan customer IDs for age verification |
| Location | `NSLocationWhenInUseUsageDescription` | Track deliveries, provide ETAs |
| Photo Library | `NSPhotoLibraryUsageDescription` | Upload delivery confirmation photos |
| ATS | `NSAllowsArbitraryLoads = true` | Allow HTTP during development |

### What You Need (iOS)

**1. Apple Developer Account ($99/year)**
- Enroll at https://developer.apple.com/programs/
- For organizations: D-U-N-S number required
- Individual accounts are faster to set up

**2. App Store Connect Setup**
1. https://appstoreconnect.apple.com/ → "My Apps" → "+" → "New App"
2. Fill in:
   - **Platform:** iOS
   - **Name:** GreenExpress
   - **Bundle ID:** `com.greenexpress.delivery`
   - **SKU:** `greenexpress-ios-001`

**3. Signing Certificates (Xcode on macOS)**
1. Open `ios/App/App.xcodeproj` in Xcode 15+
2. Xcode → Settings → Accounts → Add your Apple ID
3. Project settings → Signing & Capabilities → check "Automatically manage signing"
4. Select your Team — Xcode generates certificates automatically

**4. App Icons**
Add to `ios/App/App/Assets.xcassets/AppIcon.appiconset/`. Required sizes:
- 1024×1024 (App Store)
- 180×180 (iPhone 60pt @3x)
- 120×120 (iPhone 60pt @2x)
- 167×167 (iPad Pro)

**5. Submit**
1. Xcode: Product → Archive → Distribute App → App Store Connect → Upload
2. App Store Connect: fill metadata, upload screenshots
3. Age rating: **17+** (cannabis content)
4. Category: Food & Drink or Shopping
5. Privacy policy URL required

---

## Part 2: Google Play Store Submission

### Android Permissions (already in `android/app/src/main/AndroidManifest.xml`)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
```

Camera and GPS features are marked `required="false"` so the app installs on devices without them.

### What You Need (Android)

**1. Google Play Developer Account ($25 one-time fee)**
- Sign up at https://play.google.com/console/
- Takes 1–2 days for verification
- You'll need a Google account

**2. Play Console Setup**
1. Go to https://play.google.com/console/ → "Create app"
2. Fill in:
   - **App name:** GreenExpress
   - **Default language:** English (US)
   - **App type:** App or game → App
   - **Free or paid:** Free

**3. App Signing**
Google Play uses **Play App Signing** by default:
- Google generates and stores the signing key
- You upload with an "upload key" (Google re-signs with the app signing key)
- Capacitor can generate the upload key:
  ```bash
  cd android
  ./gradlew bundleRelease   # generates app/build/outputs/bundle/release/
  ```
- First time: Android Studio will walk you through keystore creation

**4. Store Listing Requirements**
- **Short description:** One-liner (80 chars max)
- **Full description:** What the app does, compliance info
- **Screenshots:** Minimum 2 (phone), recommend 4+ (phone + 7" tablet + 10" tablet)
- **Feature graphic:** 1024×500 banner for the store listing
- **App icon:** 512×512 PNG

**5. Content Rating**
- Complete the content rating questionnaire in Play Console
- Disclose drug-related content → **Mature 17+** rating
- The app is a delivery marketplace connecting to licensed dispensaries — be clear about this

**6. App Category & Tags**
- **Category:** Food & Drink or Shopping
- **Tags:** Delivery, Cannabis (if available)

**7. Target Audience & Content**
- Target age: **18+**
- Content disclosure: "References to alcohol, tobacco, or drug use"

**8. Privacy Policy**
- Publicly accessible privacy policy URL (same as iOS)

**9. Build & Upload**
```bash
# Build the web app, then build Android:
bun run build:android

# Open in Android Studio:
# Open the android/ directory as a project
# Build → Generate Signed Bundle / APK → Android App Bundle → Release

# Or from command line (after setting up keystore):
cd android && ./gradlew bundleRelease
```

Upload the `.aab` (Android App Bundle) file to Play Console under Production → Create new release.

**10. Compliance Checklist**
- [ ] Privacy policy linked
- [ ] App properly discloses cannabis-adjacent content
- [ ] Age gate / verification in checkout (already implemented)
- [ ] No illegal sales facilitated — connects to licensed dispensaries only
- [ ] Geo-restricted to legal jurisdictions (consider implementing location gates)

---

## Shared Configuration

### App Identity
- **Bundle ID:** `com.greenexpress.delivery` (both platforms)
- **App Name:** GreenExpress
- **Capacitor Version:** 8.5.0

### API Connectivity
The `src/lib/api-config.ts` module detects Capacitor at runtime and routes all `/api/*`
requests to the live server: `https://ef5d2c4ae9113753571b85ddf95ab4dd.ctonew.app`

No local SQLite database runs on mobile — all data goes through the API.

### Developer Workflow

```bash
# Web development:
bun run dev
bun run publish          # Republish web site

# Mobile builds:
bun run build:ios        # Build + sync iOS
bun run build:android    # Build + sync Android
bun run build:mobile     # Build + sync both

# After code changes (manual):
bun run build && node scripts/capacitor-entry.js && npx cap sync
```

### Testing on Device

**iOS:** Open `ios/App/App.xcodeproj` in Xcode, select a connected device or simulator, press Cmd+R.

**Android:** Open the `android/` directory in Android Studio, select a connected device or emulator, press Run.

## Support
- Capacitor docs: https://capacitorjs.com/docs
- Apple Developer: https://developer.apple.com/
- Google Play Console: https://play.google.com/console/
