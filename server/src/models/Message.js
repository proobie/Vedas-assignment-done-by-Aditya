const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', index: true, required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    text: { type: String, default: '' },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', MessageSchema);
module.exports = { Message };


