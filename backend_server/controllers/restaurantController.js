// backend_server/controllers/restaurantController.js

// import { Request, Response } from 'express';
import pkg from 'express';
const { Request, Response } = pkg;
import Restaurant from '../models/Restaurant.js';
import jwt from 'jsonwebtoken';

// Get all restaurants with search, filter, and pagination
// GET /api/restaurants
export const getAllRestaurants = async (req, res) => {
  try {
        const { search, priceRange, rating, location } = req.query;

        // Build the query object based on provided filters
        const queryObj = {status: 'approved'}; // Only fetch approved restaurants

        if (search) {
            queryObj.$or = [
                { name: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }
        if (priceRange) {
            const prices = Array.isArray(priceRange) ? priceRange : [priceRange];
            queryObj.priceRange = { $in: prices };
        }
        if (rating) {
            queryObj.rating = { $gte: parseFloat(rating) };
        }
        if (location) {
            queryObj.location = { $regex: location, $options: 'i' };
        }

        // sorting
        let sortOption = {createdAt: -1}; // default sorting by newest
        if(sort === 'rating') {
            sortOption = { rating: -1 };
        } else if(sort === 'price_low') {
            sortOption = { priceRange: 1 };
        } else if(sort === 'price_high') {
            sortOption = { priceRange: -1 };
        }

        // pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Fetch restaurants with the constructed query and sorting
        const restaurants = await Restaurant.find(queryObj)
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            page,
            limit,
            total: await Restaurant.countDocuments(queryObj),
            data: restaurants
        });
    } catch (error) {
        console.error('Error in getAllRestaurants:', error);
        res.status(500).json({ message: error.message });
    }
};


// Get featured and exclusive restaurants
// GET /api/restaurants/featured
export const getFeaturedRestaurants = async (req, res) => {
  try {
    const featured = await Restaurant.find({
        status: 'approved',
        $or: [{ featured: true }, { exclusive: true }]
    }).limit(10);

    res.status(200).json({ data: featured });

  } catch (error) {
    console.error('Error in getFeaturedRestaurants:', error);
    res.status(500).json({ message: error.message });
  }
};



// Get single restaurants by slug
// GET /api/restaurants/:slug
export const getRestaurantBySlug = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug});

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    // If the restaurant is not approved, verify if the user is the owner or an admin
    if (restaurant.status !== 'approved') {
        let isAuthorized = false;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id);
                if (user && (user.role === 'admin' || (user.role === 'restaurant_owner' && restaurant.owner.toString() === user._id.toString()))) {
                    isAuthorized = true;
                }
                
            } catch (error) {
                // Ignore token verification errors here, as we will handle unauthorized access below

            }
        }
        if (!isAuthorized) {
            return res.status(404).json({ message: 'Restaurant not found or not approved yet' });
        }
    }
    res.status(200).json({ data: restaurant });

  } catch (error) {
    console.error('Error in getRestaurantBySlug:', error);
    res.status(400).json({ message: error.message });
  }
};


//Get dynamic seat availability for slots
// GET /api/restaurants/:id/availability
export const getRestaurantAvailability = async (req, res) => {
  try {
    const {date} = req.query;
    if (!date) {
        return res.status(400).json({ message: 'Please provide a date' });
    }

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
    }

    const bookingDate = new Date(date);


    // get all active bookings for the restaurant on the given date
    const bookings = await Booking.find({
        restaurant: restaurant._id,
        date: bookingDate,
        status: { $in: ['pending', 'confirmed'] } // only consider active bookings
    });

    //Map slots to available seats
    const availability = restaurant.availableSlots.map(slot => {
        const bookedSeats = bookings.filter(booking => booking.time === slot.time).reduce((total, booking) => total + booking.guests, 0);
        const totalSeats = restaurant.totalSeats || 20; // Default to 20 if not specified
        const availableSeats = Math.max(0, totalSeats - bookedSeats); // Ensure available seats don't go negative
        return {
            time: slot.time,
            availableSeats,

            isAvailable: availableSeats > 0
        };
    });
    res.status(200).json({ data: availability });
  } catch (error) {
    console.error('Error in getRestaurantAvailability:', error);
    res.status(500).json({ message: error.message });
  }
};
