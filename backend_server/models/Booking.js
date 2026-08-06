// backend_server/models/Booking.js

import { Schema, model } from 'mongoose';

const bookingSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
        date: { type: Date, required: true },
        time: { type: String, required: true },
        guests: { type: Number, required: true },
        occasion: { type: String, required: false },
        specialRequests: { type: String, required: false },
        status: { type: String, enum: ["pending", "confirmed", "rejected", "cancelled", "completed"], default: 'pending' },
        bookingId: { type: String, unique: true },
    },
    { timestamps: true }
);


//Auto-generate a unique booking ID before saving the booking
bookingSchema.pre('save', async function (next) {
    if (!this.bookingId) {
        this.bookingId = 'BK' + Date.now() + Math.floor(Math.random() * 1000);
    }
    next();
});

const Booking = model('Booking', bookingSchema);
export default Booking;

