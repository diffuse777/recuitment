import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();
dns.setServers(['8.8.8.8', '1.1.1.1']);

const uri = process.env.MONGO_URI;

console.log("Attempting to connect to MongoDB Atlas...");

mongoose.connect(uri, { serverSelectionTimeoutMS: 20000, family: 4 })
  .then(() => {
    console.log("✅ Success! Successfully connected to MongoDB Atlas!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Connection failed!");
    console.error("Error details:", err.message);
    if (err.reason) console.error("Reason:", String(err.reason));
    process.exit(1);
  });
