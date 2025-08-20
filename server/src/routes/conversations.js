const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { Conversation } = require('../models/Conversation');
const { Message } = require('../models/Message');

const router = express.Router();

// GET /conversations/:id/messages
router.get('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const conv = await Conversation.findById(id);
    if (!conv || !conv.participants.some((p) => String(p) === String(req.user._id))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const page = Number(req.query.page || 1);
    const limit = Math.min(50, Number(req.query.limit || 30));
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    return res.json({ messages: messages.reverse() });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = { conversationsRouter: router };


