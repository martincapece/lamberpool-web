import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET all tournaments
router.get('/', async (req, res) => {
  try {
    const { teamId } = req.query;

    const tournaments = await prisma.tournament.findMany({
      where: teamId && teamId !== 'undefined' ? { teamId: teamId as string } : {},
      select: {
        id: true,
        name: true,
        teamId: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json(tournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
});

// GET active tournament
router.get('/active', async (req, res) => {
  try {
    const { teamId } = req.query;

    const tournament = await prisma.tournament.findFirst({
      where: teamId && teamId !== 'undefined' ? { teamId: teamId as string } : {},
      select: {
        id: true,
        name: true,
        teamId: true,
      },
    });

    if (!tournament) {
      return res.status(404).json({ error: 'No tournament found' });
    }

    res.json(tournament);
  } catch (error) {
    console.error('Error fetching active tournament:', error);
    res.status(500).json({ error: 'Failed to fetch active tournament' });
  }
});

// POST create tournament
router.post('/', async (req, res) => {
  try {
    const { name, teamId } = req.body;

    if (!name || !teamId) {
      return res.status(400).json({ error: 'Name and teamId are required' });
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        teamId,
      },
      include: {
        seasons: {
          include: {
            competitions: {
              include: { matches: true },
            },
          },
        },
      },
    });

    res.status(201).json(tournament);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create tournament', details: error.message });
  }
});

// DELETE tournament
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.tournament.delete({
      where: { id },
    });

    res.json({ message: 'Tournament deleted successfully', deletedTournamentId: id });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    res.status(500).json({ error: 'Failed to delete tournament' });
  }
});

export default router;
