import { Router } from 'express';
import { getDirectory } from '../controllers/directoryController.js';

const router = Router();

router.get('/all', getDirectory);

export default router;
