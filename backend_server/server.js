import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/db.js'; // 1. Added missing import for connectDB
import authRoutes from './routes/authRoutes.js'; 
import restaurantRouter from './routes/restaurantRoutes.js'; // 1. Added missing import for restaurantRoutes
import bookingRouter from './routes/bookingRoutes.js';

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

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRouter);
app.use('/api/bookings', bookingRouter);

//Global error handling 
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,

   });
});

// 2. Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});