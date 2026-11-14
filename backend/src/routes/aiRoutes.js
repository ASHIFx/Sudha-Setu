import { Router } from 'express';

import { chat, getChatHistory, transcribeAudio } from '../controllers/aiController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/transcribe', transcribeAudio);

router.use(protect);

router.post('/chat', chat);
router.get('/chat/:chatId', getChatHistory);

export default router;
