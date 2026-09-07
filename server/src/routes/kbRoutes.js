import { Router } from 'express';

import {
  listRules,
  getRuleById,
  createRule,
  updateRule,
  deleteRule,
} from '../controllers/kbController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

// Public listing (active rules). Search/filter/pagination supported.
router.get('/', listRules);

// Single rule detail.
router.get('/:id', getRuleById);

// Write operations require authentication + doctor/admin role.
router.post('/', protect, authorize('doctor', 'admin'), createRule);
router.put('/:id', protect, authorize('doctor', 'admin'), updateRule);
router.delete('/:id', protect, authorize('doctor', 'admin'), deleteRule);

export default router;
