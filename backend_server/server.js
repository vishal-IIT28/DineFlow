import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/db.js'; // 1. Added missing import

const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
await connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('DineFlow API Running...Server is up and running!');
});

// 2. Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});