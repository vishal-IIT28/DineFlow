import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js'; 
import restaurantRouter from './routes/restaurantRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import ownerRouter from './routes/ownerRoutes.js'; // 1. Added ownerRoutes import
import './config/cloudinary.js'; // 2. Initialized Cloudinary config
import adminRouter from './routes/adminRoutes.js';

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
app.use('/api/owner', ownerRouter); // 3. Registered owner route endpoints
app.use('/api/admin', adminRouter); 

//Global error handling 
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
   });
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});