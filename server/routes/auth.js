import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asSafeString } from '../middleware/sanitize.js';

const router = express.Router();

// Initialize the Google OAuth client (We can use a dummy client ID for now or grab it from env)
// Ideally, the client ID should be provided in .env
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy-client-id');

// Separate admin login (username/password) — not used by participant Google login
router.post('/admin', async (req, res) => {
  try {
    const username = asSafeString(req.body?.username, 100);
    const password = asSafeString(req.body?.password, 200);
    const expectedPassword = process.env.ADMIN_PASSWORD || 'recuitment@0007';
    const expectedUsername = (process.env.ADMIN_USERNAME || 'cybernerdsXowsap').trim().toLowerCase();
    const providedUsername = username.trim().toLowerCase();

    if (!providedUsername || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    if (providedUsername !== expectedUsername || password !== expectedPassword) {
      return res.status(401).json({ message: 'Invalid admin credentials.' });
    }

    let user = await User.findOne({ role: 'admin' });
    if (!user) {
      user = new User({
        email: 'admin@klu.ac.in',
        name: String(username).trim() || 'Club Administrator',
        picture: '',
        googleId: 'admin-local',
        role: 'admin',
      });
      await user.save();
    } else {
      user.name = String(username).trim() || user.name;
      user.role = 'admin';
      await user.save();
    }

    const userId = user._id.toString();
    const authToken = jwt.sign(
      { userId, role: 'admin', authType: 'admin' },
      process.env.JWT_SECRET || 'supersecretjwtkey_replace_me_in_production',
      { expiresIn: '7d' }
    );

    res.json({
      token: authToken,
      user: {
        _id: userId,
        email: user.email,
        name: user.name,
        picture: user.picture || '',
        role: 'admin',
        authType: 'admin',
      },
    });
  } catch (error) {
    console.error('Admin Auth Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Participants use this to message the recruitment board
router.get('/admin-contact', async (_req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'No admin account available yet.' });
    }
    res.json({
      admin: {
        _id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error('Admin contact error:', error);
    res.status(500).json({ message: 'Failed to load admin contact.' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    // In a real application, you would verify the token with Google:
    // const ticket = await client.verifyIdToken({
    //   idToken: token,
    //   audience: process.env.GOOGLE_CLIENT_ID,
    // });
    // const payload = ticket.getPayload();
    
    // For this demonstration, we'll assume the frontend sends the decoded user info securely (NOT RECOMMENDED for production)
    // Or we decode it without verification if we trust the frontend for now, or just expect the frontend to pass the email.
    // Let's decode it safely (assuming frontend sends credential which is a JWT):
    
    const payload = jwt.decode(token);
    
    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    const { email: rawEmail, name, picture, sub: googleId } = payload;
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

    // Participants must use university email IDs only
    if (!email.endsWith('@klu.ac.in')) {
      return res.status(403).json({
        message: 'Access restricted to university email IDs ending with @klu.ac.in only.',
      });
    }

    let userRole = email === 'admin@klu.ac.in' ? 'admin' : 'participant';
    let userId = googleId; // Mock ID

    // Restore or create participant (supports re-login after admin deleted an old session user)
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });
    if (!user) {
      user = new User({
        email,
        name,
        picture,
        googleId,
        role: userRole,
      });
      await user.save();
    } else {
      user.googleId = googleId || user.googleId;
      user.name = name || user.name;
      user.picture = picture || user.picture;
      user.email = email;
      if (user.role !== 'admin') user.role = 'participant';
      await user.save();
    }
    userId = user._id.toString();
    userRole = user.role;

    // Generate our own JWT
    const authToken = jwt.sign(
      { userId, role: userRole },
      process.env.JWT_SECRET || 'supersecretjwtkey_replace_me_in_production',
      { expiresIn: '7d' }
    );

    res.json({ 
      token: authToken, 
      user: { _id: userId, email, name, picture, role: userRole, googleId } 
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
