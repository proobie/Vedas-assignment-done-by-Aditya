# Mobile (Expo React Native)

## Setup
1. Install dependencies:
```bash
npm install
```
2. API URL is configured in `app.json` under `expo.extra.API_URL` (Android emulator default: `http://10.0.2.2:4000`).
3. Start the app:
```bash
npm run start
```
- Press `a` for Android, `i` for iOS, or scan the QR with Expo Go.

## Notes
- Uses `socket.io-client` for realtime, `react-native-gifted-chat` for a polished UI.
