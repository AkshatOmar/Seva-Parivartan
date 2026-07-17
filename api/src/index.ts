import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import 'dotenv/config';
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';

import authRouter from './routes/auth';
import profileRouter from './routes/profile';
import matchesRouter from './routes/matches';
import connectionsRouter from './routes/connections';
import messagesRouter from './routes/messages';
import adminRouter from './routes/admin';
import { authMiddleware } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 4000;

// ── Security Middleware ────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// ── Rate Limiting ──────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ── Public Routes ──────────────────────────────────────────────
app.use('/api/auth', authRouter);

// ── Protected Routes ───────────────────────────────────────────
app.use('/api/profile',     authMiddleware, profileRouter);
app.use('/api/matches',     authMiddleware, matchesRouter);
app.use('/api/connections', authMiddleware, connectionsRouter);
app.use('/api/messages',    authMiddleware, messagesRouter);
app.use('/api/admin',       authMiddleware, adminRouter);

// ── Health check ───────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Nightly matching cron ──────────────────────────────────────
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

cron.schedule('0 2 * * *', async () => {
  console.log('[cron] Running nightly matching job...');
  const { data, error } = await supabaseAdmin.rpc('run_matching');
  if (error) console.error('[cron] Matching failed:', error);
  else console.log('[cron] Matching complete, rows affected:', data);
});

// ── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Seva Parivartan API running on port ${PORT}`);
});

export default app;
