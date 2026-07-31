// backend_server/models/Restaurant.js

import { Schema, model } from 'mongoose';

const restaurantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true },
    cuisine: { type: String, required: true, trim: true },
    priceRange: { type: String, enum: ["$", "$$", "$$$", "$$$$"], required: true },
    rating: { type: Number, default: 5.0, min: 0, max: 5.0 },
    reviewCount: { type: Number, default: 0 },
    location: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    image: { type: String, required: false, default: '' },
    chef: { type: String },
    tags: [{ type: String }],
    availableSlots: [{ type: String }],
    featured: { type: Boolean, default: false },
    exclusive: { type: Boolean, default: false },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    totalSeats: { type: Number, default: 0 },
  }, 
  { timestamps: true }
);

const Restaurant = model('Restaurant', restaurantSchema);

export default Restaurant;