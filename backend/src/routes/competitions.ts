import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

const syncLegacyFinalPhoto = async (competitionId: string) => {
  const primaryPhoto = await prisma.competitionFinalPhoto.findFirst({
    where: { competitionId },
    orderBy: [{ order: 'asc' }, { uploadedAt: 'asc' }],
    select: { url: true },
  });

  return prisma.competition.update({
    where: { id: competitionId },
    data: { finalTablePhotoUrl: primaryPhoto?.url ?? null },
    include: {
      season: true,
      matches: true,
      finalPhotos: {
        orderBy: [{ order: 'asc' }, { uploadedAt: 'asc' }],
      },
    },
  });
};

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
        finalPhotos: {
          select: {
            id: true,
            url: true,
            order: true,
            uploadedAt: true,
          },
          orderBy: [{ order: 'asc' }, { uploadedAt: 'asc' }],
        },
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

// GET final photos by competition
router.get('/:id/final-photos', async (req, res) => {
  try {
    const { id } = req.params;

    const finalPhotos = await prisma.competitionFinalPhoto.findMany({
      where: { competitionId: id },
      orderBy: [{ order: 'asc' }, { uploadedAt: 'asc' }],
    });

    res.json(finalPhotos);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch competition final photos', details: error.message });
  }
});

// POST add final photo to competition gallery
router.post('/:id/final-photos', async (req, res) => {
  try {
    const { id } = req.params;
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ error: 'photoUrl is required' });
    }

    const competitionExists = await prisma.competition.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!competitionExists) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    const existingPhotos = await prisma.competitionFinalPhoto.findMany({
      where: { competitionId: id },
      select: { order: true },
      orderBy: { order: 'desc' },
      take: 1,
    });

    const nextOrder = existingPhotos.length > 0 ? existingPhotos[0].order + 1 : 0;

    await prisma.competitionFinalPhoto.create({
      data: {
        competitionId: id,
        url: photoUrl,
        order: nextOrder,
      },
    });

    const competition = await syncLegacyFinalPhoto(id);
    res.status(201).json(competition);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add competition photo', details: error.message });
  }
});

// DELETE one final photo by photo id
router.delete('/final-photos/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;

    const existingPhoto = await prisma.competitionFinalPhoto.findUnique({
      where: { id: photoId },
      select: { competitionId: true },
    });

    if (!existingPhoto) {
      return res.status(404).json({ error: 'Competition final photo not found' });
    }

    await prisma.competitionFinalPhoto.delete({
      where: { id: photoId },
    });

    const competition = await syncLegacyFinalPhoto(existingPhoto.competitionId);
    res.json(competition);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Competition final photo not found' });
    }
    res.status(500).json({ error: 'Failed to delete competition photo', details: error.message });
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

    const competitionExists = await prisma.competition.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!competitionExists) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    const firstPhoto = await prisma.competitionFinalPhoto.findFirst({
      where: { competitionId: id },
      orderBy: [{ order: 'asc' }, { uploadedAt: 'asc' }],
      select: { id: true },
    });

    if (firstPhoto) {
      await prisma.competitionFinalPhoto.update({
        where: { id: firstPhoto.id },
        data: { url: photoUrl },
      });
    } else {
      await prisma.competitionFinalPhoto.create({
        data: {
          competitionId: id,
          url: photoUrl,
          order: 0,
        },
      });
    }

    const competition = await syncLegacyFinalPhoto(id);

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

    await prisma.competitionFinalPhoto.deleteMany({
      where: { competitionId: id },
    });

    const competition = await prisma.competition.update({
      where: { id },
      data: {
        finalTablePhotoUrl: null,
      },
      include: {
        season: true,
        matches: true,
        finalPhotos: {
          orderBy: [{ order: 'asc' }, { uploadedAt: 'asc' }],
        },
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
