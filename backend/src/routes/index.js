import { Router } from 'express';
import authRoutes from './authRoutes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: 'Governing Authority Dashboard API',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);

export default router;
