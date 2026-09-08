import { Router } from 'express';

import {
  intakeCase,
  getDoctorQueue,
  getCaseById,
  prescribeCase,
  updateCase,
  getCasePDF,
} from '../controllers/caseController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(protect);

router.post('/intake', intakeCase);
router.get('/queue', authorize('doctor', 'support', 'admin'), getDoctorQueue);
router.patch('/:id/prescribe', authorize('doctor', 'admin'), prescribeCase);
router.patch('/:id', authorize('doctor', 'admin'), updateCase);
router.get('/:id/pdf', getCasePDF);
router.get('/:id', getCaseById);

export default router;
