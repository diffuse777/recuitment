import app, { connectDB } from '../server/app.js';

await connectDB().catch((error) => {
  console.error('MongoDB connection error:', error?.message || error);
});

export default app;
