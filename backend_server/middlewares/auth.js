//backend_server/middlewares/auth.js

// import {Request, NextFunction, Response} from 'express';
import pkg from 'express';
const {Request, NextFunction, Response} = pkg;
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to protect routes
export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token, excluding the password field
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            // Attach user to request object
            req.user = user;
            // Proceed to the next middleware or route handler
            next();
        } catch (error) {
            console.error('Error in protect middleware:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
            return;
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};


// Middleware to check if the user is an admin
export const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin only.' });
    }
};

// Middleware to check if the user is a restaurant owner
export const restaurantOwnerOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'restaurant_owner' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Restaurant owner only.' });
    }
};
