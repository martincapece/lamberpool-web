import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET all players
router.get('/', async (req, res) => {
  try {
    const { teamId } = req.query;
    
    const players = await prisma.player.findMany({
      where: teamId ? { teamId: teamId as string } : undefined,
      orderBy: { number: 'asc' },
      select: {
        id: true,
        name: true,
        number: true,
        teamId: true,
        matchPlayers: {
          select: {
            id: true,
            goals: true,
            cards: true,
            position: true,
            ratings: { select: { score: true } },
            guestRatings: { select: { score: true } },
            match: {
              select: {
                id: true,
                date: true,
                competition: {
                  select: {
                    id: true,
                    name: true,
                    season: {
                      select: {
                        id: true,
                        year: true,
                        tournament: {
                          select: {
                            id: true,
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    res.json(players);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// GET player by ID with stats
router.get('/:id', async (req, res) => {
  try {
    const player = await prisma.player.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        number: true,
        teamId: true,
        matchPlayers: {
          select: {
            id: true,
            position: true,
            goals: true,
            cards: true,
            match: {
              select: {
                id: true,
                opponent: true,
                date: true,
                goalsFor: true,
                goalsAgainst: true,
                result: true,
              },
            },
            ratings: {
              select: {
                id: true,
                score: true,
                judge: { select: { id: true, name: true } },
              },
            },
            guestRatings: {
              select: {
                id: true,
                score: true,
                guestJudge: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json(player);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// POST create player
router.post('/', async (req, res) => {
  try {
    const { name, number, teamId } = req.body;

    if (!name || !number || !teamId) {
      return res.status(400).json({ error: 'Name, number, and teamId are required' });
    }

    const player = await prisma.player.create({
      data: {
        name,
        number,
        teamId,
      },
    });

    res.status(201).json(player);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Player number already exists for this team' });
    }
    res.status(500).json({ error: 'Failed to create player' });
  }
});

// PUT update player
router.put('/:id', async (req, res) => {
  try {
    const { name, number } = req.body;

    if (!name || !number) {
      return res.status(400).json({ error: 'Name and number are required' });
    }

    const player = await prisma.player.update({
      where: { id: req.params.id },
      data: {
        name,
        number,
      },
    });

    res.json(player);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Player number already exists for this team' });
    }
    res.status(500).json({ error: 'Failed to update player' });
  }
});

// DELETE player
router.delete('/:id', async (req, res) => {
  try {
    const playerId = req.params.id;

    await prisma.$transaction(async (tx) => {
      const matchPlayers = await tx.matchPlayer.findMany({
        where: { playerId },
        select: { id: true },
      });

      if (matchPlayers.length > 0) {
        const matchPlayerIds = matchPlayers.map((mp) => mp.id);
        await tx.rating.deleteMany({
          where: { matchPlayerId: { in: matchPlayerIds } },
        });
        await tx.guestRating.deleteMany({
          where: { matchPlayerId: { in: matchPlayerIds } },
        });
        await tx.matchPlayer.deleteMany({
          where: { id: { in: matchPlayerIds } },
        });
      }

      await tx.player.delete({
        where: { id: playerId },
      });
    });

    res.json({ message: 'Player deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

export default router;
