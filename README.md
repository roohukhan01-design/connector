# ROOHU CONNECT — M1 (connection + secure pairing)

By Roohu · roohukhan01@gmail.com

## Status (honest)
- Desktop pairing protocol: TESTED (10 checks, real server.js + ws, see desktop/test/protocol.test.js). Test used a stand-in cert and stubbed Bonjour.
- Android Kotlin: reviewed and fixed, NOT compiled. Electron app: NOT launched. No APK/.exe built yet.
- Expect a possible small build error on the first GitHub run. Send the log and it gets fixed.

## What M1 has
- Windows app (Electron): dashboard, QR code + 6-digit code, paired phone list, Forget button
- Android app (Kotlin, Material 3): splash, scan QR, pair with code, find PC on Wi-Fi, auto reconnect
- Encrypted link: wss (TLS) with a self-signed certificate, pinned by SHA-256 fingerprint
- The code is never sent. Phone sends HMAC(code, nonce + certificate fingerprint)
- Code: 6 digits, one use, 2 minutes, max 5 wrong tries
- Phone gets a random token (30 days, renewed on use). PC keeps only its hash
- Phone keeps the token in EncryptedSharedPreferences

## Not in M1
Files, screen, mouse/keyboard, clipboard, notifications, background service, internet access.
Other tabs are not shown because they would be fake buttons.

## Build
1. Upload this folder to GitHub (files at the root of the repo).
2. Actions tab → "Android APK" and "Windows installer" run on push.
3. Download from the run: RoohuConnect-apk, RoohuConnect-Windows.
Release APK is signed with the debug key for now. Make a real key before sharing.

## Test on your devices (M1 checklist)
1. Install both. Same Wi-Fi.
2. PC: allow Windows Firewall when asked (private network).
3. PC: Pair new phone. Phone: Scan QR. Expect "Connected".
4. Close and open the phone app. Expect auto reconnect.
5. Turn Wi-Fi off and on. Expect reconnect.
6. PC: Forget. Phone: Connect. Expect an error.
7. Wrong code 5 times. Expect the code to stop working.

## Known limits
- Pairing with code only (no QR) is weaker: someone on your Wi-Fi who sees the pairing could guess a 6-digit code offline. Use QR when you can.
- QR uses the first PC address. If it is a virtual adapter (WSL, VirtualBox), use address + code.
- The PC certificate key is stored in your Windows user folder, not encrypted.
- Windows installer has the default Electron icon for now.
