import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET all judges
router.get('/', async (req, res) => {
  try {
    const judges = await prisma.judge.findMany();
    res.json(judges);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch judges' });
  }
});

// POST create judge
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const judge = await prisma.judge.create({
      data: { name },
    });

    res.status(201).json(judge);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Judge already exists' });
    }
    res.status(500).json({ error: 'Failed to create judge' });
  }
});

export default router;
