import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET all guest ratings for a match player
router.get('/:matchPlayerId', async (req, res) => {
  try {
    const guestRatings = await prisma.guestRating.findMany({
      where: { matchPlayerId: req.params.matchPlayerId },
      include: { guestJudge: true },
    });

    res.json(guestRatings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch guest ratings' });
  }
});

// POST create or update guest rating
router.post('/', async (req, res) => {
  try {
    const { matchPlayerId, guestJudgeId, score } = req.body;

    if (!matchPlayerId || !guestJudgeId || score === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate score is between 1 and 10
    if (score < 1 || score > 10) {
      return res.status(400).json({ error: 'Score must be between 1 and 10' });
    }

    const guestRating = await prisma.guestRating.upsert({
      where: {
        matchPlayerId_guestJudgeId: { matchPlayerId, guestJudgeId },
      },
      create: { matchPlayerId, guestJudgeId, score },
      update: { score },
      include: { guestJudge: true },
    });

    res.status(201).json(guestRating);
  } catch (error) {
    console.error('Error creating/updating guest rating:', error);
    res.status(500).json({ error: 'Failed to create/update guest rating' });
  }
});

// DELETE all guest ratings
router.delete('/', async (_req, res) => {
  try {
    const result = await prisma.guestRating.deleteMany({});
    res.json({ deleted: result.count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete guest ratings' });
  }
});

export default router;
