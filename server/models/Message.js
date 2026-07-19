import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // For participant it's admin ID, for admin it's participant ID
  },
  text: {
    type: String,
    required: true,
  },
  senderRole: {
    type: String,
    enum: ['admin', 'participant'],
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);
