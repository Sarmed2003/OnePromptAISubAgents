import express from 'express';

const router = express.Router();
const startTime = Date.now();

router.get('/', (_req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  res.status(200).json({
    status: 'healthy',
    uptime: uptime,
    timestamp: new Date().toISOString(),
  });
});

export default router;
