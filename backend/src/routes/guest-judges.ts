import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET all guest judges for a match
router.get('/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;

    if (!matchId || matchId === 'undefined') {
      return res.status(400).json({ error: 'matchId is required' });
    }

    const guestJudges = await prisma.guestJudge.findMany({
      where: { matchId },
      orderBy: { createdAt: 'asc' },
    });

    res.json(guestJudges);
  } catch (error: any) {
    console.error('Error fetching guest judges:', error);
    res.status(500).json({ error: 'Failed to fetch guest judges', details: error.message });
  }
});

// POST create guest judge for a match
router.post('/', async (req, res) => {
  try {
    const { matchId, name } = req.body;

    if (!matchId || !name) {
      return res.status(400).json({ error: 'matchId and name are required' });
    }

    const guestJudge = await prisma.guestJudge.create({
      data: {
        matchId,
        name,
      },
    });

    console.log('Guest judge created:', guestJudge);
    res.status(201).json(guestJudge);
  } catch (error: any) {
    console.error('Error creating guest judge:', error);
    res.status(500).json({ error: 'Failed to create guest judge', details: error.message });
  }
});

// DELETE guest judge
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.guestJudge.delete({
      where: { id },
    });

    res.json({ message: 'Guest judge deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting guest judge:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Guest judge not found' });
    }
    res.status(500).json({ error: 'Failed to delete guest judge' });
  }
});

export default router;
