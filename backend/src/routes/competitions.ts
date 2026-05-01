import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET all competitions for a season
router.get('/:seasonId', async (req, res) => {
  try {
    const { seasonId } = req.params;

    if (!seasonId || seasonId === 'undefined') {
      return res.status(400).json({ error: 'seasonId is required' });
    }

    const competitions = await prisma.competition.findMany({
      where: { seasonId },
      select: {
        id: true,
        name: true,
        seasonId: true,
        finalTablePhotoUrl: true,
        matches: {
          select: { id: true },
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(competitions);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch competitions', details: error.message });
  }
});

// GET active competition for a season
router.get('/:seasonId/active', async (req, res) => {
  try {
    const { seasonId } = req.params;

    if (!seasonId || seasonId === 'undefined') {
      return res.status(400).json({ error: 'seasonId is required' });
    }

    const competition = await prisma.competition.findFirst({
      where: { seasonId, isActive: true },
      include: { matches: { orderBy: { date: 'desc' } } },
    });

    if (!competition) {
      console.log(`No active competition found for season ${seasonId}`);
      return res.status(404).json({ error: 'No active competition found' });
    }

    res.json(competition);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch active competition', details: error.message });
  }
});

// POST create competition
router.post('/', async (req, res) => {
  try {
    const { seasonId, name } = req.body;

    if (!seasonId || !name) {
      return res.status(400).json({ error: 'seasonId and name are required' });
    }

    const competition = await prisma.competition.create({
      data: {
        seasonId,
        name,
        isActive: true,
      },
      include: {
        matches: { orderBy: { date: 'desc' } },
      },
    });

    res.status(201).json(competition);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create competition', details: error.message });
  }
});

// DELETE competition with cascading cleanup
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const cleanupResult = await prisma.$transaction(async (tx) => {
      const competition = await tx.competition.findUnique({
        where: { id },
        include: {
          season: {
            select: {
              id: true,
              tournamentId: true,
            },
          },
        },
      });

      if (!competition) {
        throw Object.assign(new Error('Competition not found'), { code: 'P2025' });
      }

      await tx.competition.delete({
        where: { id },
      });

      let deletedSeasonId: string | null = null;
      let deletedTournamentId: string | null = null;

      const remainingCompetitions = await tx.competition.count({
        where: { seasonId: competition.season.id },
      });

      if (remainingCompetitions === 0) {
        deletedSeasonId = competition.season.id;
        await tx.season.delete({
          where: { id: competition.season.id },
        });

        const remainingSeasons = await tx.season.count({
          where: { tournamentId: competition.season.tournamentId },
        });

        if (remainingSeasons === 0) {
          deletedTournamentId = competition.season.tournamentId;
          await tx.tournament.delete({
            where: { id: competition.season.tournamentId },
          });
        }
      }

      return {
        deletedCompetitionId: id,
        deletedSeasonId,
        deletedTournamentId,
      };
    });

    res.json({
      message: 'Competition deleted successfully with cascading cleanup',
      ...cleanupResult,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Competition not found' });
    }
    res.status(500).json({ error: 'Failed to delete competition' });
  }
});

// PUT update final table photo
router.put('/:id/final-table-photo', async (req, res) => {
  try {
    const { id } = req.params;
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ error: 'photoUrl is required' });
    }

    const competition = await prisma.competition.update({
      where: { id },
      data: {
        finalTablePhotoUrl: photoUrl,
      },
      include: {
        season: true,
        matches: true,
      },
    });

    res.json(competition);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Competition not found' });
    }
    res.status(500).json({ error: 'Failed to update competition photo' });
  }
});

// DELETE final table photo
router.delete('/:id/final-table-photo', async (req, res) => {
  try {
    const { id } = req.params;

    const competition = await prisma.competition.update({
      where: { id },
      data: {
        finalTablePhotoUrl: null,
      },
      include: {
        season: true,
        matches: true,
      },
    });

    res.json(competition);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Competition not found' });
    }
    res.status(500).json({ error: 'Failed to delete competition photo' });
  }
});

export default router;
