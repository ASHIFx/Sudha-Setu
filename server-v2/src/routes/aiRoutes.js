import { Router } from 'express';

import { chat, getChatHistory } from '../controllers/aiController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

// All AI routes require a valid JWT
router.use(protect);

router.post('/chat', chat);
router.get('/chat/:chatId', getChatHistory);

export default router;
