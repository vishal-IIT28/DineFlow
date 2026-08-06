// backend_server/routes/restaurantRoutes.js

import { Router } from 'express';
import { getAllRestaurants, getFeaturedRestaurants, getRestaurantBySlug, getRestaurantAvailability, getRestaurantReviews} from '../controllers/restaurantController.js';

const restaurantRouter = Router();

restaurantRouter.get('/', getAllRestaurants);
restaurantRouter.get('/featured', getFeaturedRestaurants);
restaurantRouter.get('/:id/availability', getRestaurantAvailability);
restaurantRouter.get('/:id/reviews', getRestaurantReviews);
restaurantRouter.get('/:slug', getRestaurantBySlug);

export default restaurantRouter;
