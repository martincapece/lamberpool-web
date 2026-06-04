import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET all seasons for a tournament
router.get('/:tournamentId', async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const seasons = await prisma.season.findMany({
      where: { tournamentId },
      select: {
        id: true,
        year: true,
        isActive: true,
        tournamentId: true,
        tournament: {
          select: {
            id: true,
            name: true,
            teamId: true,
          },
        },
        competitions: {
          select: {
            id: true,
            name: true,
            seasonId: true,
            matches: {
              select: { id: true },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { year: 'desc' },
    });

    res.json(seasons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch seasons' });
  }
});

// GET active season for a tournament
router.get('/:tournamentId/active', async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const season = await prisma.season.findFirst({
      where: { tournamentId, isActive: true },
      include: { competitions: { select: { id: true, name: true } } },
    });

    if (!season) {
      return res.status(404).json({ error: 'No active season found' });
    }

    res.json(season);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active season' });
  }
});

// POST create season
router.post('/', async (req, res) => {
  try {
    const { tournamentId, year } = req.body;

    if (!tournamentId || !year) {
      return res.status(400).json({ error: 'tournamentId and year are required' });
    }

    const season = await prisma.season.create({
      data: {
        tournamentId,
        year,
        isActive: true,
      },
      include: {
        competitions: { include: { matches: true } },
      },
    });

    res.status(201).json(season);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create season', details: error.message });
  }
});

// DELETE season
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const cleanupResult = await prisma.$transaction(async (tx) => {
      const season = await tx.season.findUnique({
        where: { id },
        select: {
          id: true,
          tournamentId: true,
        },
      });

      if (!season) {
        throw Object.assign(new Error('Season not found'), { code: 'P2025' });
      }

      await tx.season.delete({
        where: { id },
      });

      let deletedTournamentId: string | null = null;
      const remainingSeasons = await tx.season.count({
        where: { tournamentId: season.tournamentId },
      });

      if (remainingSeasons === 0) {
        deletedTournamentId = season.tournamentId;
        await tx.tournament.delete({
          where: { id: season.tournamentId },
        });
      }

      return {
        deletedSeasonId: id,
        deletedTournamentId,
      };
    });

    res.json({ message: 'Season deleted successfully', ...cleanupResult });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Season not found' });
    }
    res.status(500).json({ error: 'Failed to delete season' });
  }
});

export default router;
