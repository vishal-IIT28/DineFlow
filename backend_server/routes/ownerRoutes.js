// backend/routes/ownerRoutes.js

import { Router } from "express";
import { 
  createOwnerRestaurant, 
  getOwnerBookings, 
  getOwnerRestaurant, 
  updateBookingStatus, 
  updateOwnerRestaurant 
} from "../controllers/ownerController.js";
import upload from "../config/multer.js";
import { restaurantOwnerOnly, protect } from "../middlewares/auth.js";

const ownerRouter = Router();

ownerRouter.use(protect);
ownerRouter.use(restaurantOwnerOnly);

// Support both /restaurant and /restaurants
ownerRouter.get("/restaurant", getOwnerRestaurant);
ownerRouter.get("/restaurants", getOwnerRestaurant);

ownerRouter.post("/restaurant", upload.single("image"), createOwnerRestaurant);
ownerRouter.post("/restaurants", upload.single("image"), createOwnerRestaurant);

ownerRouter.put("/restaurant", upload.single("image"), updateOwnerRestaurant);
ownerRouter.put("/restaurants", upload.single("image"), updateOwnerRestaurant);

ownerRouter.get("/bookings", getOwnerBookings);

// Support both /bookings/:id/status and /bookings/:id
ownerRouter.put("/bookings/:id/status", updateBookingStatus);
ownerRouter.put("/bookings/:id", updateBookingStatus);

export default ownerRouter;