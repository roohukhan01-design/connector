# ROOHU CONNECT — M1

By Roohu · roohukhan01@gmail.com

## Honest build status
- This commit repairs the repository layout and adds CI workflows.
- The Android and Windows builds have not yet run in GitHub Actions. Wait for both workflow results before treating the installers as verified.
- M1 pairing protocol tests are now wired into the Windows workflow. They still need a successful CI run.
- Real-device pairing, reconnect, Windows firewall behavior, and Android installation must be tested on your own devices.

## M1 features
- Windows desktop dashboard with QR code and a six-digit pairing code.
- Android app with QR scan, manual address pairing, nearby PC discovery, and saved-PC reconnect.
- TLS WebSocket connection with a SHA-256 certificate fingerprint.
- Pairing proof uses HMAC(code, nonce + certificate fingerprint); the PIN is not sent.
- One-use pairing code, two-minute expiry, and lockout after five incorrect attempts.
- Random 30-day phone token; the PC stores its hash and Android stores the token using EncryptedSharedPreferences.

## Not included in M1
File transfer, screen viewing, remote mouse/keyboard, clipboard sync, notifications, background service, and internet relay are not implemented yet.

## Repository layout
- `android/`: Gradle Android application.
- `desktop/`: Electron Windows application.
- `.github/workflows/`: Android APK and Windows installer workflows.

## Build outputs
After a successful GitHub Actions run:
- Android workflow artifact: `RoohuConnect-Android-APKs` (debug and release APKs).
- Windows workflow artifact: `RoohuConnect-Windows-Installer` (NSIS installer).

Open the repository's Actions tab, select the completed workflow run, and download its artifact from the Artifacts section.

## Test on your devices
1. Install the Android APK and Windows installer.
2. Connect both devices to the same Wi-Fi network.
3. On Windows, choose Pair new phone. On Android, scan the QR code.
4. Confirm that the phone shows Connected.
5. Close and reopen the Android app; confirm saved-PC reconnect.
6. Disable and re-enable Wi-Fi; confirm reconnect.
7. Forget the phone on Windows; confirm it can no longer reconnect.

## Security notes
- Pair using QR when possible. Manual PIN-only pairing has a weaker threat model.
- The Windows certificate private key is currently stored in the Windows user data folder without OS-backed encryption.
- The release APK is temporarily signed with the debug key. Do not distribute it publicly; configure a private release keystore first.
- The Windows installer currently uses the default Electron icon.
