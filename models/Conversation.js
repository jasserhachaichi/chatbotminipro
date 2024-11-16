const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversation: [{
    conversationID: mongoose.Schema.Types.ObjectId,
    messages: [{
      sender: { type: String, required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }]
  }]
});

module.exports = mongoose.model('Conversation', ConversationSchema);
