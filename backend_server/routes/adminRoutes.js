// backend_server/routes/adminRoutes.js

import { Router } from "express";
import { 
  approveRestaurant, 
  getAdminStats, 
  getAllRestaurants 
} from "../controllers/adminController.js";
import { adminOnly, protect } from "../middlewares/auth.js";

const adminRouter = Router();

// Apply authentication & admin authorization middlewares
adminRouter.use(protect);
adminRouter.use(adminOnly);

// Admin endpoints
adminRouter.get("/restaurants", getAllRestaurants);
adminRouter.put("/restaurants/:id/approve", approveRestaurant);
adminRouter.get("/stats", getAdminStats);

export default adminRouter;