import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET all match players for a match
router.get('/:matchId', async (req, res) => {
  try {
    const matchPlayers = await prisma.matchPlayer.findMany({
      where: { matchId: req.params.matchId },
      include: {
        player: true,
        ratings: { include: { judge: true } },
        guestRatings: { include: { guestJudge: true } },
      },
    });

    // Calculate average rating for each match player (regular + guest ratings)
    const enrichedMatchPlayers = matchPlayers.map((mp) => {
      const regularTotal = mp.ratings.reduce((sum, r) => sum + r.score, 0);
      const guestTotal = mp.guestRatings.reduce((sum, r) => sum + r.score, 0);
      const totalRatings = mp.ratings.length + mp.guestRatings.length;
      
      const avgRating = totalRatings > 0
        ? (regularTotal + guestTotal) / totalRatings
        : 0;

      return {
        ...mp,
        averageRating: parseFloat(avgRating.toFixed(2)),
      };
    });

    res.json(enrichedMatchPlayers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch match players' });
  }
});

// POST add player to match
router.post('/', async (req, res) => {
  try {
    const { matchId, playerId, position, goals = 0, cards = '' } = req.body;

    if (!matchId || !playerId || !position) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const matchPlayer = await prisma.matchPlayer.create({
      data: {
        matchId,
        playerId,
        position,
        goals,
        cards,
      },
      include: {
        player: true,
        ratings: { include: { judge: true } },
        guestRatings: { include: { guestJudge: true } },
      },
    });

    res.status(201).json(matchPlayer);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Player already added to this match' });
    }
    res.status(500).json({ error: 'Failed to add player to match' });
  }
});

// PUT update match player stats
router.put('/:id', async (req, res) => {
  try {
    const { position, goals, cards } = req.body;

    const matchPlayer = await prisma.matchPlayer.update({
      where: { id: req.params.id },
      data: {
        ...(position && { position }),
        ...(goals !== undefined && { goals }),
        ...(cards !== undefined && { cards }),
      },
      include: {
        player: true,
        ratings: { include: { judge: true } },
        guestRatings: { include: { guestJudge: true } },
      },
    });

    res.json(matchPlayer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update match player' });
  }
});

export default router;
