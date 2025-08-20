# Chat App (React Native + Node.js)

## Structure
- `server` — Express + Socket.IO + MongoDB
- `mobile` — Expo React Native

## Prereqs
- Node.js 18+
- MongoDB running locally (or update `MONGO_URI`)

## Setup

1) Server
```bash
cd server
copy ENV.sample .env   # Windows (or: cp ENV.sample .env)
npm install
npm run dev
```

2) Mobile
```bash
cd mobile
npm install
npm run start
```

Android emulator uses API URL `http://10.0.2.2:4000` (preconfigured in `mobile/app.json`).

## MVP Features
- JWT auth (register/login)
- User list with presence and last message
- 1:1 chat with realtime messaging, typing, delivery/read receipts
- Messages persisted in MongoDB

## Sample Users
Use the Register screen to create accounts, then log in with two devices/emulators.
