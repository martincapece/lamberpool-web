import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET or create team (Lamberpool FC)
router.get('/', async (req, res) => {
  try {
    let team = await prisma.team.findFirst({
      where: { name: 'Lamberpool FC' },
    });

    if (!team) {
      team = await prisma.team.create({
        data: { name: 'Lamberpool FC' },
      });
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get team' });
  }
});

// GET team by ID
router.get('/:id', async (req, res) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.params.id },
      include: {
        players: { orderBy: { number: 'asc' } },
        tournaments: {
          include: {
            seasons: {
              include: {
                competitions: {
                  include: {
                    matches: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

export default router;
