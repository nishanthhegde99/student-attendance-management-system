# Team Collaboration & Cross-Platform Workflow Guide

**MCA Major Project: Student Attendance Management System**  
**Team Composition:** 2 Developers (Developer 1 on macOS / Developer 2 on Windows)

---

## 1. Team Division & Ownership

| Workstream | Owner | Responsibilities | Key Directory |
| :--- | :--- | :--- | :--- |
| **Mobile Application (Frontend)** | **Developer 1** (macOS) | React Native, Expo Router, Screens, Forms, Zod, SVG Charts, Local Storage, UI/UX | `mobile/` |
| **Backend & Database** | **Developer 2** (Windows) | Node.js, Express, TypeScript, MongoDB Models, JWT Auth, Attendance Engine, Jest Tests | `server/` |
| **API Contract & Integration** | **Shared** | End-to-end testing, review PRs, shared data schemas, verification | `docs/API.md` |

---

## 2. GitHub Collaboration Rules

1. **Main Branch Protection:**
   - `main` branch must always contain passing, buildable code.
   - Never push directly to `main`.
2. **Branch Naming Standard:**
   - Feature branches: `feat/mobile-mark-attendance`, `feat/backend-export-csv`
   - Fix branches: `fix/duplicate-session-bug`
   - Docs branches: `docs/update-readme`
3. **Daily Sync Protocol:**
   ```bash
   # Before starting work
   git checkout main
   git pull origin main
   git checkout -b feat/your-feature-name

   # After completing work
   git add .
   git commit -m "feat(mobile): add attendance review confirmation modal"
   git push origin feat/your-feature-name
   ```
4. **Pull Requests (PR):**
   - Developer 1 opens PR -> Developer 2 reviews & tests -> Merge.
   - Developer 2 opens PR -> Developer 1 reviews & tests -> Merge.
5. **Conflict Avoidance:**
   - Developer 1 primarily works inside `mobile/`.
   - Developer 2 primarily works inside `server/`.
   - Both agree on changes to `docs/API.md` before altering request/response formats.

---

## 3. Cross-Platform Networking Guide (Mac vs Windows)

The mobile app connects to the Express backend server on port `5001`. Connecting depends on where the app runs:

| Runtime Environment | API Base URL (`mobile/.env`) | Why? |
| :--- | :--- | :--- |
| **iOS Simulator (Mac)** | `http://localhost:5001/api` | Shares network stack with Mac host. |
| **Web Browser (`npm run web`)** | `http://localhost:5001/api` | Web browser runs directly on host machine. |
| **Android Emulator (Windows / Mac)** | `http://10.0.2.2:5001/api` | Android Emulator alias for host `127.0.0.1`. |
| **Physical Phone (Expo Go via Wi-Fi)** | `http://<YOUR_LAN_IP>:5001/api` | Both phone and computer must be on same Wi-Fi. (e.g. `http://192.168.1.5:5001/api`) |

### Finding your LAN IP:
- **macOS (Developer 1):**
  ```bash
  ipconfig getifaddr en0
  ```
- **Windows (Developer 2):**
  ```cmd
  ipconfig
  # Look for IPv4 Address under Wireless LAN adapter Wi-Fi (e.g., 192.168.1.X)
  ```

---

## 4. Developer Setup Cheatsheet

### Developer 1 (macOS):
```bash
# Terminal 1: Backend
cd server
npm install
npm run seed     # Populates sample teachers, classes & students
npm run dev      # Starts API server on http://localhost:5001

# Terminal 2: Mobile (Native iOS / Android / Web)
cd mobile
npm install

# Option A: Run native iOS (Xcode / CocoaPods)
npm run ios

# Option B: Run native Android
npm run android

# Option C: Run Web in browser
npm run web
```

### Developer 2 (Windows):
```cmd
:: Terminal 1: Backend
cd server
npm install
npm run seed     :: Populates test teachers, classes & students
npm run dev      :: Starts API server on http://localhost:5001

:: Terminal 2: Mobile (Native Android / Web)
cd mobile
npm install

:: Option A: Run directly on Android Emulator / Physical USB Device
npm run android

:: Option B: Open in Android Studio directly
:: Open Android Studio -> Select "Open Existing Project" -> Choose the `mobile/android` folder!

:: Option C: Build standalone debug APK without emulators
cd android
gradlew.bat assembleDebug
:: Output APK is located at: mobile/android/app/build/outputs/apk/debug/app-debug.apk
:: Transfer this APK directly to any Android phone via WhatsApp/USB and install!

:: Option D: Run Web in Chrome/Edge
npm run web
```

---

## 5. Pre-Merge Verification Checklist

Before pushing any changes or opening a PR:
- [ ] Backend tests pass: `cd server && npm test`
- [ ] Mobile TypeScript checks pass: `cd mobile && npx tsc --noEmit`
- [ ] Mobile web bundle exports without error: `cd mobile && npx expo export -p web`
- [ ] No credentials or `.env` files committed (verify `git status`)
