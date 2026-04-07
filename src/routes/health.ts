import express from 'express';

const router = express.Router();

router.get('/', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
