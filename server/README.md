# Server (Node.js + Express + Socket.IO)

## Requirements
- Node.js 18+
- MongoDB 5+

## Setup
1. Copy `ENV.sample` to `.env` and adjust values.
2. Install dependencies:
```bash
npm install
```
3. Run in dev:
```bash
npm run dev
```

Listens on `http://localhost:4000` by default.

## REST Endpoints
- POST `/auth/register`
- POST `/auth/login`
- GET `/users` (JWT)
- GET `/conversations/:id/messages` (JWT)

## Socket Events
- `message:send` { toUserId, text }
- `message:new` payload broadcast
- `typing:start|stop` { toUserId }
- `typing:update` broadcast
- `message:read` { messageId }
- `presence:update` { userId, isOnline, lastSeenAt }
