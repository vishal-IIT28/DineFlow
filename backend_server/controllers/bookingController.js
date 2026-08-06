// backend_server/controllers/bookingController.js

import Booking from "../models/Booking.js";
import Restaurant from "../models/Restaurant.js";

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req, res) => {
  try {
    const { restaurantId, date, time, guests, occasion, specialRequests } = req.body;
    if (!restaurantId || !date || !time || !guests) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if the restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Verify restaurant is approved
    if (restaurant.status !== "approved") {
      return res.status(400).json({ message: "Reservations are not open for this restaurant yet" });
    }

    // Verify seat availability
    const requestedGuests = Number(guests);

    const existingBookings = await Booking.find({
      restaurant: restaurantId,
      date: new Date(date),
      time: time,
      status: { $in: ["confirmed", "pending"] } // Only consider confirmed and pending bookings
    });

    const bookedSeats = existingBookings.reduce((total, booking) => total + booking.guests, 0);
    const totalSeats = restaurant.totalSeats || 0;
    const availableSeats = totalSeats - bookedSeats;

    if (requestedGuests > availableSeats) {
      return res.status(400).json({ 
        message: `Not enough seats available for the selected time slot. Only ${availableSeats} seats available.` 
      });
    }

    const booking = await Booking.create({
      user: req.user?._id,
      restaurant: restaurantId,
      date: new Date(date),
      time: time,
      guests: Number(guests),
      occasion: occasion,
      specialRequests: specialRequests,
      status: "pending" // Set initial status to pending
    });

    // Populate restaurant info before returning
    const populatedBooking = await booking.populate("restaurant", "name location image address");

    res.status(201).json(populatedBooking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged-in user's bookings
// @route   GET /api/bookings/my
// @access  Private
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user?._id })
      .populate("restaurant", "name location image address slug")
      .sort({ date: -1, time: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel a booking
// @route   PATCH /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Ensure the booking belongs to the logged-in user
    if (booking.user.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Booking cancelled successfully", booking });
  } catch (error) {
    console.error("Error canceling booking:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all bookings for a restaurant (for Restaurant Owner)
// @route   GET /api/bookings/restaurant/:restaurantId
// @access  Private (Owner/Admin)
export const getRestaurantBookings = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Authorization: owner or admin check
    if (restaurant.owner.toString() !== req.user?._id.toString() && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    

    const bookings = await Booking.find({ restaurant: restaurantId })
      .populate("user", "name email phone")
      .sort({ date: -1, time: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching restaurant bookings:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking status (confirm/reject)
// @route   PATCH /api/bookings/:id/status
// @access  Private (Owner/Admin)
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["confirmed", "rejected", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const booking = await Booking.findById(id).populate("restaurant");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check ownership or admin status
    if (booking.restaurant.owner.toString() !== req.user?._id.toString() && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    booking.status = status;
    await booking.save();

    res.json({ message: `Booking status updated to ${status}`, booking });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: error.message });
  }
};
