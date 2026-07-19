import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { resolveUserId } from '../utils/resolveUserId.js';

const router = express.Router();

async function emitMessage(req, message, senderId, receiverId) {
  const io = req.app.get('io');
  if (!io) return;

  const payload = message.toObject ? message.toObject() : message;
  const rooms = new Set([
    String(senderId),
    String(receiverId),
    String(payload.senderId),
    String(payload.receiverId),
  ]);

  // Also notify by googleId rooms (stale client sessions)
  const users = await User.find({
    _id: { $in: [payload.senderId, payload.receiverId] },
  }).select('_id googleId');

  users.forEach((u) => {
    rooms.add(String(u._id));
    if (u.googleId) rooms.add(String(u.googleId));
  });

  rooms.forEach((room) => io.to(room).emit('receive_message', payload));
}

// Private inbox for a participant (or admin): all their messages
router.get('/inbox/:userId', async (req, res) => {
  try {
    const resolvedUserId = await resolveUserId(req.params.userId);

    const messages = await Message.find({
      $or: [{ senderId: resolvedUserId }, { receiverId: resolvedUserId }],
    })
      .sort({ createdAt: 1 })
      .lean();

    const unreadCount = messages.filter(
      (m) =>
        String(m.receiverId) === String(resolvedUserId) &&
        m.senderRole === 'admin' &&
        !m.read
    ).length;

    res.json({
      messages,
      unreadCount,
      userId: String(resolvedUserId),
    });
  } catch (error) {
    console.error('Error fetching inbox:', error);
    res.status(500).json({ message: 'Failed to fetch inbox messages.' });
  }
});

// Send a private message (REST — reliable for admin → participant)
router.post('/', async (req, res) => {
  try {
    const { senderId, receiverId, text, senderRole } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: 'Message text is required.' });
    }
    if (senderRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can send messages.' });
    }

    const resolvedSenderId = await resolveUserId(senderId);
    const resolvedReceiverId = await resolveUserId(receiverId);

    const message = await Message.create({
      senderId: resolvedSenderId,
      receiverId: resolvedReceiverId,
      text: text.trim(),
      senderRole,
    });

    await emitMessage(req, message, senderId, receiverId);

    res.status(201).json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      message: error.message?.includes('log in again')
        ? error.message
        : 'Failed to send message.',
    });
  }
});

// Get conversation history between two users
router.get('/:userId1/:userId2', async (req, res) => {
  try {
    const userId1 = await resolveUserId(req.params.userId1);
    const userId2 = await resolveUserId(req.params.userId2);

    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    }).sort({ createdAt: 1 });

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages from database.' });
  }
});

// Mark admin → participant messages as read
router.put('/read/:userId', async (req, res) => {
  try {
    const userId = await resolveUserId(req.params.userId);
    await Message.updateMany(
      { receiverId: userId, senderRole: 'admin', read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update read status.' });
  }
});

export default router;
