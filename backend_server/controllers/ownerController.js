// backend/controllers/ownerController.js

import { v2 as cloudinary } from "cloudinary";
import Restaurant from "../models/Restaurant.js";
import Booking from "../models/Booking.js";

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "QuickDine" },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Upload failed"));
        resolve({ secure_url: result.secure_url });
      }
    );
    stream.end(fileBuffer);
  });
};

// Get owner's restaurant
// GET /api/owner/restaurant
export const getOwnerRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user?._id });
    if (!restaurant) {
      return res.status(200).json(null);
    }
    res.json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Create owner's restaurant (submitted to pending)
// POST /api/owner/restaurant
export const createOwnerRestaurant = async (req, res) => {
  try {
    const existing = await Restaurant.findOne({ owner: req.user?._id });
    if (existing) {
      return res.status(400).json({ message: "You already have a restaurant registered" });
    }

    const {
      name,
      description,
      cuisine,
      priceRange,
      location,
      address,
      chef,
      tags,
      availableSlots,
      totalSeats
    } = req.body;

    if (!name || !description || !cuisine || !priceRange || !location || !address || !chef) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const slugExists = await Restaurant.findOne({ slug });
    if (slugExists) {
      return res.status(400).json({ message: "A restaurant with this name already exists" });
    }

    // Handle image upload
    let imageUrl = "";
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    // Setup parsed tags and slots
    const parsedTags =
      typeof tags === "string"
        ? tags.split(",").map((t) => t.trim())
        : tags || [];

    const parsedSlots =
      typeof availableSlots === "string"
        ? availableSlots.split(",").map((s) => s.trim())
        : availableSlots || ["17:00", "18:00", "19:00", "20:00", "21:00"];

    const restaurant = await Restaurant.create({
      name,
      slug,
      description,
      cuisine,
      priceRange,
      location,
      address,
      chef,
      image: imageUrl,
      tags: parsedTags,
      availableSlots: parsedSlots,
      totalSeats: totalSeats ? Number(totalSeats) : 20,
      owner: req.user?._id,
      status: "pending"
    });

    res.status(201).json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Update owner's restaurant
// PUT /api/owner/restaurant
export const updateOwnerRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user?._id });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant profile not found" });
    }

    const {
      name,
      description,
      cuisine,
      priceRange,
      location,
      address,
      chef,
      tags,
      availableSlots,
      totalSeats
    } = req.body;

    if (name) restaurant.name = name;
    if (description) restaurant.description = description;
    if (cuisine) restaurant.cuisine = cuisine;
    if (priceRange) restaurant.priceRange = priceRange;
    if (location) restaurant.location = location;
    if (address) restaurant.address = address;
    if (chef) restaurant.chef = chef;
    if (totalSeats) restaurant.totalSeats = Number(totalSeats);

    if (tags) {
      restaurant.tags =
        typeof tags === "string"
          ? tags.split(",").map((t) => t.trim())
          : tags;
    }

    if (availableSlots) {
      restaurant.availableSlots =
        typeof availableSlots === "string"
          ? availableSlots.split(",").map((s) => s.trim())
          : availableSlots;
    }

    // Handle new image upload if any
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      restaurant.image = result.secure_url;
    }

    const updated = await restaurant.save();
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Get bookings for owner's restaurant
// GET /api/owner/bookings
export const getOwnerBookings = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user?._id });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant profile not found" });
    }

    const bookings = await Booking.find({ restaurant: restaurant._id })
      .populate("user", "name email phone")
      .sort({ date: -1, time: -1 });

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Update status for a booking
// PUT /api/owner/booking/:id/status
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["confirmed", "rejected", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const restaurant = await Restaurant.findOne({ owner: req.user?._id });
    if (!restaurant) {
      return res.status(404).json({ message: "Owner restaurant not found" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify booking belongs to this owner's restaurant
    if (booking.restaurant.toString() !== restaurant._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this booking" });
    }

    booking.status = status;
    await booking.save();

    res.json({ message: `Booking status updated to ${status}`, booking });
  } catch (error) {
    console.error("Error in updateBookingStatus:", error);
    res.status(400).json({ message: error.message });
  }
};