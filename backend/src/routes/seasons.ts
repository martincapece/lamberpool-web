import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET all seasons for a tournament
router.get('/:tournamentId', async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const seasons = await prisma.season.findMany({
      where: { tournamentId },
      include: { competitions: { include: { matches: true } } },
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
      include: { competitions: { include: { matches: true } } },
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

    console.log('Season created:', season);
    res.status(201).json(season);
  } catch (error: any) {
    console.error('Error creating season:', error);
    res.status(500).json({ error: 'Failed to create season', details: error.message });
  }
});

// DELETE season
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.season.delete({
      where: { id },
    });

    res.json({ message: 'Season deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting season:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Season not found' });
    }
    res.status(500).json({ error: 'Failed to delete season' });
  }
});

export default router;
