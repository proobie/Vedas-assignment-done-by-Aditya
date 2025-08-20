const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
    lastMessageAt: { type: Date, default: null },
    lastMessageText: { type: String, default: '' },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 });

const Conversation = mongoose.model('Conversation', ConversationSchema);
module.exports = { Conversation };


