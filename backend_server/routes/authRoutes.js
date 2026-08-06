// backend_server/routes/authRoutes.js
import {Router} from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/authControllers.js';
import { protect } from '../middlewares/auth.js';

// Create a router instance
const authRouter = Router();

// Define routes for authentication
authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);
authRouter.get('/profile', protect, getUserProfile);
authRouter.get('/me', protect, getUserProfile);

export default authRouter;