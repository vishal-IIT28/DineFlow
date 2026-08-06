import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "./models/User.js";
import Restaurant from "./models/Restaurant.js";
import Booking from "./models/Booking.js";
import Review from "./models/Review.js";

const mongoUri = process.env.MONGO_URI || (process.env.MONGODB_URI ? `${process.env.MONGODB_URI}/dineflow` : "");
const shouldClear = process.argv.includes("--clear") || process.argv.includes("--fresh");

const users = [
  {
    key: "admin",
    name: "Avery Morgan",
    email: "admin@dineflow.com",
    password: "AdminPass123!",
    phone: "2125550101",
    role: "admin",
  },
  {
    key: "owner",
    name: "Maya Chen",
    email: "owner@dineflow.com",
    password: "OwnerPass123!",
    phone: "2125550102",
    role: "restaurant_owner",
  },
  {
    key: "customer",
    name: "Jordan Ellis",
    email: "customer@dineflow.com",
    password: "CustomerPass123!",
    phone: "2125550103",
    role: "user",
  },
];

const operatingHours = {
  monday: "Closed",
  tuesday: "17:00-22:00",
  wednesday: "17:00-22:00",
  thursday: "17:00-22:00",
  friday: "17:00-23:00",
  saturday: "12:00-23:00",
  sunday: "12:00-21:00",
};

const restaurants = [
  {
    name: "Harbor & Hearth",
    slug: "harbor-and-hearth",
    description:
      "A polished waterfront dining room serving wood-fired seafood, dry-aged steaks, and seasonal produce from Hudson Valley farms.",
    cuisine: "American",
    priceRange: "$$$$",
    location: "Brooklyn, NY",
    address: "42 Pierhouse Lane, Brooklyn, NY 11201",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=85",
    chef: "Nora Whitaker",
    tags: ["Waterfront", "Wood Fire", "Seasonal", "Wine Cellar"],
    availableSlots: ["17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"],
    operatingHours,
    featured: true,
    exclusive: false,
    totalSeats: 72,
    status: "approved",
  },
  {
    name: "Saffron Room",
    slug: "saffron-room",
    description:
      "A contemporary Indian restaurant built around tandoor-fired breads, coastal curries, and thoughtful spice-forward tasting menus.",
    cuisine: "Indian",
    priceRange: "$$$",
    location: "Manhattan, NY",
    address: "118 Lexington Avenue, New York, NY 10016",
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1800&q=85",
    chef: "Rohan Mehta",
    tags: ["Tandoor", "Tasting Menu", "Cocktails", "Modern Indian"],
    availableSlots: ["12:00", "12:30", "13:00", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"],
    operatingHours: { ...operatingHours, monday: "17:00-21:30" },
    featured: true,
    exclusive: true,
    totalSeats: 54,
    status: "approved",
  },
  {
    name: "Onda Verde",
    slug: "onda-verde",
    description:
      "An airy Italian coastal kitchen specializing in handmade pasta, crudo, market vegetables, and bright aperitivo service.",
    cuisine: "Italian",
    priceRange: "$$$",
    location: "Queens, NY",
    address: "73 Vernon Boulevard, Long Island City, NY 11101",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1800&q=85",
    chef: "Elena Conti",
    tags: ["Handmade Pasta", "Crudo", "Coastal", "Aperitivo"],
    availableSlots: ["11:30", "12:00", "12:30", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"],
    operatingHours: { ...operatingHours, sunday: "11:30-20:30" },
    featured: false,
    exclusive: false,
    totalSeats: 48,
    status: "approved",
  },
];

const reviewTemplates = [
  {
    restaurantSlug: "harbor-and-hearth",
    rating: 5,
    comment: "The pacing was excellent, the seafood was pristine, and the service team handled a birthday dinner beautifully.",
    visitedDate: "2026-07-18T00:00:00.000Z",
  },
  {
    restaurantSlug: "saffron-room",
    rating: 5,
    comment: "Layered flavors without feeling heavy. The tasting menu felt personal, polished, and genuinely memorable.",
    visitedDate: "2026-07-21T00:00:00.000Z",
  },
  {
    restaurantSlug: "onda-verde",
    rating: 4,
    comment: "Lovely room, excellent pasta, and a strong by-the-glass wine list. We would happily book again.",
    visitedDate: "2026-07-26T00:00:00.000Z",
  },
];

const hashUsers = async () => {
  const saltRounds = 10;
  return Promise.all(
    users.map(async ({ key, password, ...user }) => ({
      key,
      ...user,
      password: await bcrypt.hash(password, saltRounds),
    }))
  );
};

const upsertUsers = async () => {
  const hashedUsers = await hashUsers();
  const docsByKey = {};
  let inserted = 0;
  let updated = 0;

  for (const { key, ...user } of hashedUsers) {
    const result = await User.updateOne({ email: user.email }, { $set: user }, { upsert: true });
    inserted += result.upsertedCount || 0;
    updated += result.modifiedCount || 0;
    docsByKey[key] = await User.findOne({ email: user.email });
  }

  return { docsByKey, inserted, updated, total: hashedUsers.length };
};

const upsertRestaurants = async (ownerId) => {
  const docsBySlug = {};
  let inserted = 0;
  let updated = 0;

  for (const restaurant of restaurants) {
    const payload = { ...restaurant, owner: ownerId };
    const result = await Restaurant.updateOne({ slug: restaurant.slug }, { $set: payload }, { upsert: true });
    inserted += result.upsertedCount || 0;
    updated += result.modifiedCount || 0;
    docsBySlug[restaurant.slug] = await Restaurant.findOne({ slug: restaurant.slug });
  }

  return { docsBySlug, inserted, updated, total: restaurants.length };
};

const seedReviews = async (customerId, docsBySlug) => {
  const restaurantIds = Object.values(docsBySlug).map((restaurant) => restaurant._id);
  const deleteResult = await Review.deleteMany({ restaurant: { $in: restaurantIds } });

  const reviews = reviewTemplates.map((review) => ({
    user: customerId,
    restaurant: docsBySlug[review.restaurantSlug]._id,
    rating: review.rating,
    comment: review.comment,
    visitedDate: new Date(review.visitedDate),
  }));

  const insertedReviews = await Review.insertMany(reviews);

  for (const restaurant of Object.values(docsBySlug)) {
    const aggregate = await Review.aggregate([
      { $match: { restaurant: restaurant._id } },
      { $group: { _id: "$restaurant", rating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
    ]);

    const stats = aggregate[0] || { rating: 0, reviewCount: 0 };
    await Restaurant.updateOne(
      { _id: restaurant._id },
      { $set: { rating: Number(stats.rating.toFixed(1)), reviewCount: stats.reviewCount } }
    );
  }

  return { deleted: deleteResult.deletedCount || 0, inserted: insertedReviews.length };
};

const clearCollections = async () => {
  const collections = [
    ["reviews", Review],
    ["bookings", Booking],
    ["restaurants", Restaurant],
    ["users", User],
  ];

  for (const [name, model] of collections) {
    const result = await model.deleteMany({});
    console.log(`Cleared ${result.deletedCount} ${name}.`);
  }
};

const seed = async () => {
  if (!mongoUri) {
    throw new Error("MONGO_URI is required. Set MONGO_URI in backend_server/.env or your environment before running the seeder.");
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected.");

  if (shouldClear) {
    console.log("Fresh seed requested. Clearing existing collections...");
    await clearCollections();
  }

  const userResult = await upsertUsers();
  console.log(
    `Users ready: ${userResult.total} total (${userResult.inserted} inserted, ${userResult.updated} updated).`
  );

  const restaurantResult = await upsertRestaurants(userResult.docsByKey.owner._id);
  console.log(
    `Restaurants ready: ${restaurantResult.total} total (${restaurantResult.inserted} inserted, ${restaurantResult.updated} updated).`
  );

  const reviewResult = await seedReviews(userResult.docsByKey.customer._id, restaurantResult.docsBySlug);
  console.log(`Reviews refreshed: ${reviewResult.inserted} inserted (${reviewResult.deleted} previous removed).`);

  console.log("Seed completed successfully.");
};

seed()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
  });
