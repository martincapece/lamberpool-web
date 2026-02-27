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
      include: { matches: { orderBy: { date: 'desc' } } },
    });

    console.log(`Competitions loaded for season ${seasonId}:`, competitions);
    res.json(competitions);
  } catch (error: any) {
    console.error('Error fetching competitions:', error);
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

    console.log(`Active competition loaded for season ${seasonId}:`, competition);
    res.json(competition);
  } catch (error: any) {
    console.error('Error fetching active competition:', error);
    res.status(500).json({ error: 'Failed to fetch active competition', details: error.message });
  }
});

// POST create competition
router.post('/', async (req, res) => {
  try {
    const { seasonId, name, jerseyUrl } = req.body;

    if (!seasonId || !name) {
      return res.status(400).json({ error: 'seasonId and name are required' });
    }

    const competition = await prisma.competition.create({
      data: {
        seasonId,
        name,
        jerseyUrl: jerseyUrl || null,
        isActive: true,
      },
      include: {
        matches: { orderBy: { date: 'desc' } },
      },
    });

    console.log('Competition created:', competition);
    res.status(201).json(competition);
  } catch (error: any) {
    console.error('Error creating competition:', error);
    res.status(500).json({ error: 'Failed to create competition', details: error.message });
  }
});

// DELETE competition con cascade inteligente
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener la competencia para saber su seasonId
    const competition = await prisma.competition.findUnique({
      where: { id },
      include: { season: true },
    });

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    const seasonId = competition.season.id;

    // Eliminar la competencia
    await prisma.competition.delete({
      where: { id },
    });

    // Verificar si quedan competencias en la season
    const remainingCompetitions = await prisma.competition.count({
      where: { seasonId },
    });

    // Si no hay más competencias, eliminar la season
    if (remainingCompetitions === 0) {
      const season = await prisma.season.findUnique({
        where: { id: seasonId },
        include: { tournament: true },
      });

      if (season) {
        const tournamentId = season.tournament.id;

        // Eliminar la season
        await prisma.season.delete({
          where: { id: seasonId },
        });

        // Verificar si quedan seasons en el tournament
        const remainingSeasons = await prisma.season.count({
          where: { tournamentId },
        });

        // Si no hay más seasons, eliminar el tournament
        if (remainingSeasons === 0) {
          await prisma.tournament.delete({
            where: { id: tournamentId },
          });
        }
      }
    }

    res.json({ message: 'Competition deleted successfully with cascading cleanup' });
  } catch (error: any) {
    console.error('Error deleting competition:', error);
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
    console.error('Error updating competition photo:', error);
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
    console.error('Error deleting competition photo:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Competition not found' });
    }
    res.status(500).json({ error: 'Failed to delete competition photo' });
  }
});

// PUT update jersey URL
router.put('/:id/jersey', async (req, res) => {
  try {
    const { id } = req.params;
    const { jerseyUrl } = req.body;

    if (!jerseyUrl) {
      return res.status(400).json({ error: 'jerseyUrl is required' });
    }

    const competition = await prisma.competition.update({
      where: { id },
      data: {
        jerseyUrl,
      },
      include: {
        season: true,
        matches: true,
      },
    });

    res.json(competition);
  } catch (error: any) {
    console.error('Error updating competition jersey:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Competition not found' });
    }
    res.status(500).json({ error: 'Failed to update competition jersey' });
  }
});

// DELETE jersey URL
router.delete('/:id/jersey', async (req, res) => {
  try {
    const { id } = req.params;

    const competition = await prisma.competition.update({
      where: { id },
      data: {
        jerseyUrl: null,
      },
      include: {
        season: true,
        matches: true,
      },
    });

    res.json(competition);
  } catch (error: any) {
    console.error('Error deleting competition jersey:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Competition not found' });
    }
    res.status(500).json({ error: 'Failed to delete competition jersey' });
  }
});

export default router;
