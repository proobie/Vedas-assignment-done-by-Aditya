const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { User } = require('../models/User');
const { Message } = require('../models/Message');
const { Conversation } = require('../models/Conversation');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('_id name email isOnline lastSeenAt')
      .sort({ name: 1 });

    // attach last message with each user
    const conversations = await Conversation.find({ participants: req.user._id })
      .select('_id participants lastMessageText lastMessageAt');
    const pairKey = (a, b) => `${String(a)}_${String(b)}`;
    const map = new Map();
    for (const c of conversations) {
      const other = c.participants.find((p) => String(p) !== String(req.user._id));
      if (other) map.set(pairKey(req.user._id, other), c);
    }

    const data = users.map((u) => {
      const c = map.get(pairKey(req.user._id, u._id));
      return {
        id: u._id,
        name: u.name,
        email: u.email,
        isOnline: u.isOnline,
        lastSeenAt: u.lastSeenAt,
        lastMessageText: c?.lastMessageText || '',
        lastMessageAt: c?.lastMessageAt || null,
        conversationId: c?._id || null,
      };
    });

    return res.json({ users: data });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = { usersRouter: router };


