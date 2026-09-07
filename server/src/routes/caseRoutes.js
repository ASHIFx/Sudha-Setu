import { Router } from 'express';

import {
  intakeCase,
  getDoctorQueue,
  getCaseById,
  updateCase,
  getCasePDF,
} from '../controllers/caseController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

// Every case route touches patient medical data, so authenticate all of them.
router.use(protect);

router.post('/intake', intakeCase);

// The dashboard queue is clinical staff only; a patient must not see other
// patients' cases.
router.get('/queue', authorize('doctor', 'support', 'admin'), getDoctorQueue);

// Doctor/admin case updates: status, assignment, notes, prescription.
router.patch('/:id', authorize('doctor', 'admin'), updateCase);

// PDF download — ownership checked inside the controller.
router.get('/:id/pdf', getCasePDF);

// Ownership is checked inside the controller: patients get their own case only.
router.get('/:id', getCaseById);

export default router;
