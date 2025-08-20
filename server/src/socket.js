const jwt = require('jsonwebtoken');
const { User } = require('./models/User');
const { Conversation } = require('./models/Conversation');
const { Message } = require('./models/Message');

const userIdToSocketIds = new Map();

function addConnection(userId, socketId) {
  const key = String(userId);
  const set = userIdToSocketIds.get(key) || new Set();
  set.add(socketId);
  userIdToSocketIds.set(key, set);
}

function removeConnection(userId, socketId) {
  const key = String(userId);
  const set = userIdToSocketIds.get(key);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) userIdToSocketIds.delete(key);
}

function getUserSockets(userId) {
  return Array.from(userIdToSocketIds.get(String(userId)) || []);
}

function getDirectRoomId(a, b) {
  const [x, y] = [String(a), String(b)].sort();
  return `dm:${x}:${y}`;
}

function attachSocketHandlers(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) return next(new Error('Unauthorized'));
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      const user = await User.findById(payload.userId);
      if (!user) return next(new Error('Unauthorized'));
      socket.user = { id: user._id, name: user.name };
      return next();
    } catch (err) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    addConnection(userId, socket.id);
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeenAt: new Date() });
    io.emit('presence:update', { userId, isOnline: true, lastSeenAt: new Date().toISOString() });

    socket.on('typing:start', ({ toUserId }) => {
      const room = getDirectRoomId(userId, toUserId);
      socket.to(room).emit('typing:update', { fromUserId: userId, typing: true });
    });

    socket.on('typing:stop', ({ toUserId }) => {
      const room = getDirectRoomId(userId, toUserId);
      socket.to(room).emit('typing:update', { fromUserId: userId, typing: false });
    });

    socket.on('message:send', async (payload, cb) => {
      try {
        const { toUserId, text } = payload;
        // find or create conversation
        let conversation = await Conversation.findOne({ participants: { $all: [userId, toUserId] } });
        if (!conversation) {
          conversation = await Conversation.create({ participants: [userId, toUserId] });
        }

        const message = await Message.create({
          conversationId: conversation._id,
          senderId: userId,
          recipientId: toUserId,
          text,
          deliveredAt: new Date(),
        });

        conversation.lastMessageAt = message.createdAt;
        conversation.lastMessageText = text;
        await conversation.save();

        const room = getDirectRoomId(userId, toUserId);
        socket.join(room);
        getUserSockets(toUserId).forEach((sid) => io.sockets.sockets.get(sid)?.join(room));

        io.to(room).emit('message:new', {
          id: message._id,
          conversationId: conversation._id,
          senderId: message.senderId,
          recipientId: message.recipientId,
          text: message.text,
          createdAt: message.createdAt,
          deliveredAt: message.deliveredAt,
          readAt: message.readAt,
        });
        cb?.({ ok: true, messageId: message._id, conversationId: conversation._id });
      } catch (err) {
        cb?.({ ok: false, error: 'Failed to send' });
      }
    });

    socket.on('message:read', async ({ messageId }) => {
      const msg = await Message.findById(messageId);
      if (!msg) return;
      if (String(msg.recipientId) !== String(userId)) return;
      msg.readAt = new Date();
      await msg.save();
      const room = getDirectRoomId(msg.senderId, msg.recipientId);
      io.to(room).emit('message:read', { messageId: msg._id, readAt: msg.readAt });
    });

    socket.on('join:dm', ({ otherUserId }) => {
      const room = getDirectRoomId(userId, otherUserId);
      socket.join(room);
    });

    socket.on('disconnect', async () => {
      removeConnection(userId, socket.id);
      if (getUserSockets(userId).length === 0) {
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeenAt: new Date() });
        io.emit('presence:update', { userId, isOnline: false, lastSeenAt: new Date().toISOString() });
      }
    });
  });
}

module.exports = { attachSocketHandlers };


