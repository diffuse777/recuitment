import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import { Server } from 'socket.io';
import { createServer } from 'http';
import authRoutes from './routes/auth.js';
import applicationRoutes from './routes/applications.js';
import messageRoutes from './routes/messages.js';
import Message from './models/Message.js';
import User from './models/User.js';
import { resolveUserId } from './utils/resolveUserId.js';

dotenv.config();

// Local DNS often refuses MongoDB Atlas SRV lookups; use public resolvers for this process.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser tools (no Origin) and configured frontends
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin || true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

// Socket.io integration
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

app.set('io', io); // Make io available in routes

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/messages', messageRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  family: 4,
  serverSelectionTimeoutMS: 20000,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    console.warn('⚠️ Server running without database connection!');
  });

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
