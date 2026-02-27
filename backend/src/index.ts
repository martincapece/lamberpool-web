import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import teamsRouter from './routes/teams';
import tournamentsRouter from './routes/tournaments';
import seasonsRouter from './routes/seasons';
import competitionsRouter from './routes/competitions';
import judgesRouter from './routes/judges';
import playersRouter from './routes/players';
import matchesRouter from './routes/matches';
import matchPlayersRouter from './routes/match-players';
import ratingsRouter from './routes/ratings';
import photosRouter from './routes/photos';
import championshipsRouter from './routes/championships';
import filtersRouter from './routes/filters';
import guestJudgesRouter from './routes/guest-judges';
import guestRatingsRouter from './routes/guest-ratings';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
// Aumentar límite de JSON para imágenes base64 (hasta 5MB)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Lamberpool Backend is running' });
});

// API Routes
app.use('/api/teams', teamsRouter);
app.use('/api/tournaments', tournamentsRouter);
app.use('/api/seasons', seasonsRouter);
app.use('/api/competitions', competitionsRouter);
app.use('/api/judges', judgesRouter);
app.use('/api/players', playersRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/match-players', matchPlayersRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/photos', photosRouter);
app.use('/api/championships', championshipsRouter);
app.use('/api/filters', filtersRouter);
app.use('/api/guest-judges', guestJudgesRouter);
app.use('/api/guest-ratings', guestRatingsRouter);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
