import { Router } from 'express';

import {
  intakeCase,
  getCaseQueue,
  getCaseById,
  prescribeCase,
  getCasePDF,
} from '../controllers/caseController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { requireVerifiedDoctor } from '../middlewares/roleMiddleware.js';

const router = Router();

router.use(protect);

// GET /queue MUST be defined before GET /:id so "queue" is not matched as an :id param
router.get('/queue', authorize('doctor', 'admin'), getCaseQueue);

router.post('/intake', intakeCase);

// PATCH /:id — doctor (verified) or admin can update status / notes / prescriptions
router.patch('/:id', authorize('doctor', 'admin'), requireVerifiedDoctor, prescribeCase);

router.get('/:id/pdf', getCasePDF);
router.get('/:id', getCaseById);

export default router;
