require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const { connectToDatabase } = require('./lib/db');
const { authRouter } = require('./routes/auth');
const { usersRouter } = require('./routes/users');
const { conversationsRouter } = require('./routes/conversations');
const { attachSocketHandlers } = require('./socket');

const PORT = process.env.PORT || 4000;

async function main() {
  await connectToDatabase();

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN?.split(',') || '*',
      credentials: true,
    },
  });

  app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') || '*', credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(morgan('dev'));

  app.get('/', (_req, res) => res.json({ ok: true, service: 'chat-server' }));
  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/conversations', conversationsRouter);

  attachSocketHandlers(io);

  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});


