import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET all matches
router.get('/', async (req, res) => {
  try {
    const { competitionId, teamId } = req.query;

    const matches = await prisma.match.findMany({
      where: {
        ...(competitionId && { competitionId: competitionId as string }),
        ...(teamId && { teamId: teamId as string }),
      },
      include: {
        matchPlayers: {
          include: {
            player: true,
            ratings: { include: { judge: true } },
            guestRatings: { include: { guestJudge: true } },
          },
        },
        photos: true,
        competition: { include: { season: { include: { tournament: true } } } },
      },
      orderBy: { date: 'desc' },
    });

    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// GET match by ID
router.get('/:id', async (req, res) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: {
        matchPlayers: {
          include: {
            player: true,
            ratings: { include: { judge: true } },
            guestRatings: { include: { guestJudge: true } },
          },
        },
        photos: true,
        competition: { include: { season: { include: { tournament: true } } } },
      },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(match);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

// POST create match
router.post('/', async (req, res) => {
  try {
    const { competitionId, teamId, opponent, date, goalsFor, goalsAgainst } = req.body;

    if (!competitionId || !teamId || !opponent || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result =
      goalsFor > goalsAgainst ? 'W' : goalsFor < goalsAgainst ? 'L' : 'D';

    const match = await prisma.match.create({
      data: {
        competitionId,
        teamId,
        opponent,
        date: new Date(date),
        goalsFor,
        goalsAgainst,
        result,
      },
      include: {
        matchPlayers: { 
          include: { 
            player: true, 
            ratings: { include: { judge: true } },
            guestRatings: { include: { guestJudge: true } },
          } 
        },
        photos: true,
      },
    });

    res.status(201).json(match);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create match' });
  }
});

// PUT update match
router.put('/:id', async (req, res) => {
  try {
    const { opponent, date, goalsFor, goalsAgainst } = req.body;

    const result =
      goalsFor > goalsAgainst ? 'W' : goalsFor < goalsAgainst ? 'L' : 'D';

    const match = await prisma.match.update({
      where: { id: req.params.id },
      data: {
        opponent,
        date: date ? new Date(date) : undefined,
        goalsFor,
        goalsAgainst,
        result,
      },
      include: {
        matchPlayers: {
          include: {
            player: true,
            ratings: { include: { judge: true } },
          },
        },
        photos: true,
      },
    });

    res.json(match);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update match' });
  }
});

// DELETE match by ID
router.delete('/:id', async (req, res) => {
  try {
    const matchId = req.params.id;

    await prisma.$transaction(async (tx) => {
      const matchPlayers = await tx.matchPlayer.findMany({
        where: { matchId },
        select: { id: true },
      });

      if (matchPlayers.length > 0) {
        const matchPlayerIds = matchPlayers.map((mp) => mp.id);
        await tx.rating.deleteMany({
          where: { matchPlayerId: { in: matchPlayerIds } },
        });
        await tx.matchPlayer.deleteMany({
          where: { id: { in: matchPlayerIds } },
        });
      }

      await tx.photo.deleteMany({
        where: { matchId },
      });

      await tx.match.delete({
        where: { id: matchId },
      });
    });

    res.json({ message: 'Match deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

// DELETE all matches (optionally filtered by competitionId)
router.delete('/', async (req, res) => {
  try {
    const { competitionId } = req.query;

    const matches = await prisma.match.findMany({
      where: competitionId ? { competitionId: competitionId as string } : undefined,
      select: { id: true },
    });

    if (matches.length === 0) {
      return res.json({ deleted: 0 });
    }

    const matchIds = matches.map((m) => m.id);

    await prisma.$transaction(async (tx) => {
      const matchPlayers = await tx.matchPlayer.findMany({
        where: { matchId: { in: matchIds } },
        select: { id: true },
      });

      if (matchPlayers.length > 0) {
        const matchPlayerIds = matchPlayers.map((mp) => mp.id);
        await tx.rating.deleteMany({
          where: { matchPlayerId: { in: matchPlayerIds } },
        });
        await tx.matchPlayer.deleteMany({
          where: { id: { in: matchPlayerIds } },
        });
      }

      await tx.photo.deleteMany({
        where: { matchId: { in: matchIds } },
      });

      await tx.match.deleteMany({
        where: { id: { in: matchIds } },
      });
    });

    res.json({ deleted: matchIds.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete matches' });
  }
});

export default router;
