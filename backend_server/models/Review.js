import { Schema, model } from "mongoose";

const reviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
    visitedDate: { type: Date, required: true },
  },
  { timestamps: true }
);

reviewSchema.index({ restaurant: 1, createdAt: -1 });
reviewSchema.index({ user: 1, restaurant: 1 });

const Review = model("Review", reviewSchema);

export default Review;
