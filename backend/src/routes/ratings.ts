import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET all ratings for a match player
router.get('/:matchPlayerId', async (req, res) => {
  try {
    const ratings = await prisma.rating.findMany({
      where: { matchPlayerId: req.params.matchPlayerId },
      include: { judge: true },
    });

    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// POST create or update rating
router.post('/', async (req, res) => {
  try {
    const { matchPlayerId, judgeId, score } = req.body;

    if (!matchPlayerId || !judgeId || score === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate score is between 1 and 10
    if (score < 1 || score > 10) {
      return res.status(400).json({ error: 'Score must be between 1 and 10' });
    }

    const rating = await prisma.rating.upsert({
      where: {
        matchPlayerId_judgeId: { matchPlayerId, judgeId },
      },
      create: { matchPlayerId, judgeId, score },
      update: { score },
      include: { judge: true },
    });

    res.status(201).json(rating);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create/update rating' });
  }
});

// DELETE all ratings
router.delete('/', async (_req, res) => {
  try {
    const result = await prisma.rating.deleteMany({});
    res.json({ deleted: result.count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ratings' });
  }
});

export default router;
