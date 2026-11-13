import { Router } from 'express';

import {
  getMyAmbulanceProfile,
  createDispatch,
  listDispatches,
  updateDispatchStatus,
  listAvailableAmbulances,
} from '../controllers/ambulanceController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { isAmbulance } from '../middlewares/roleMiddleware.js';

const router = Router();

router.use(protect);

router.get('/me/profile', isAmbulance, getMyAmbulanceProfile);
router.post('/dispatch', authorize('doctor', 'admin', 'ambulance', 'support'), createDispatch);
router.get('/dispatches', authorize('ambulance', 'admin', 'doctor', 'support'), listDispatches);
router.patch('/dispatches/:id/status', authorize('ambulance', 'admin'), updateDispatchStatus);
router.get('/available', authorize('ambulance', 'admin', 'doctor', 'support'), listAvailableAmbulances);

export default router;
