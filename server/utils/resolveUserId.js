import mongoose from 'mongoose';
import User from '../models/User.js';

/**
 * Accept either a MongoDB ObjectId string or a Google `sub` id
 * and return the User's MongoDB _id.
 */
export async function resolveUserId(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const id = String(userId);

  if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id) {
    return id;
  }

  const user = await User.findOne({
    $or: [{ googleId: id }, { email: id }],
  });
  if (!user) {
    throw new Error('User not found. Please log out and log in again.');
  }

  return user._id;
}
