import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Message from './models/Message.js';
import User from './models/User.js';
import { resolveUserId } from './utils/resolveUserId.js';
import app, { connectDB } from './app.js';

dotenv.config();

const allowedOrigins = [
  'http://localhost:5173',
  'https://owaspxcybernerds.xyz',
  'https://www.owaspxcybernerds.xyz',
  process.env.FRONTEND_URL,
].filter(Boolean);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_room', (userId) => {
    if (!userId) return;
    const room = String(userId);
    socket.join(room);
    console.log(`User ${socket.id} joined room ${room}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { senderId, receiverId, text, senderRole } = data;
      if (!text?.trim()) return;
      if (senderRole !== 'admin') {
        console.warn('Blocked non-admin message attempt');
        return;
      }

      const resolvedSenderId = await resolveUserId(senderId);
      const resolvedReceiverId = await resolveUserId(receiverId);

      const newMessage = new Message({
        senderId: resolvedSenderId,
        receiverId: resolvedReceiverId,
        text: text.trim(),
        senderRole,
      });
      await newMessage.save();

      const payload = newMessage.toObject();
      const rooms = new Set([
        String(senderId),
        String(receiverId),
        String(resolvedSenderId),
        String(resolvedReceiverId),
      ]);

      const users = await User.find({
        _id: { $in: [resolvedSenderId, resolvedReceiverId] },
      }).select('_id googleId');
      users.forEach((u) => {
        rooms.add(String(u._id));
        if (u.googleId) rooms.add(String(u.googleId));
      });

      rooms.forEach((room) => io.to(room).emit('receive_message', payload));
    } catch (error) {
      console.error('Error handling send_message event:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

connectDB().catch((error) => {
  console.error('MongoDB connection error:', error.message);
  console.warn('⚠️ Server running without database connection!');
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
