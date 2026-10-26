import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import profileRouter     from './routes/profile';
import matchesRouter     from './routes/matches';
import connectionsRouter from './routes/connections';
import districtsRouter   from './routes/districts';
import { authMiddleware } from './middleware/auth';

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      origin === process.env.FRONTEND_URL
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// All routes require authentication (Supabase JWT validated by authMiddleware).
// The /api/auth/* routes from the old email/password system are removed —
// authentication now happens directly via Supabase OAuth on the frontend.
app.use('/api/profile',     authMiddleware, profileRouter);
app.use('/api/matches',     authMiddleware, matchesRouter);
app.use('/api/connections', authMiddleware, connectionsRouter);
app.use('/api/districts',   authMiddleware, districtsRouter);

app.get('/health', (_req, res) => { res.json({ ok: true }); });

app.listen(PORT, () => console.log(`API running on :${PORT}`));
export default app;
