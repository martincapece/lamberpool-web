import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET all championships
router.get('/', async (req, res) => {
  try {
    const championships = await prisma.championship.findMany({
      orderBy: [
        { year: 'desc' },
        { order: 'desc' }
      ],
    });

    res.json(championships);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch championships' });
  }
});

// GET championship by year
router.get('/:year', async (req, res) => {
  try {
    const championships = await prisma.championship.findMany({
      where: { year: parseInt(req.params.year) },
      orderBy: { order: 'desc' },
    });

    res.json(championships);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch championship' });
  }
});

// POST create championship
router.post('/', async (req, res) => {
  try {
    const { year, season, division, tournament, title, jerseyUrl, altJerseyUrl, description, order } = req.body;

    if (!year || !season || !division || !tournament || !title) {
      return res.status(400).json({ error: 'year, season, division, tournament, and title are required' });
    }

    const championship = await prisma.championship.create({
      data: {
        year: parseInt(year),
        season,
        division,
        tournament,
        title,
        jerseyUrl: jerseyUrl || null,
        altJerseyUrl: altJerseyUrl || null,
        description: description || null,
        order: order || 0,
      },
    });

    res.status(201).json(championship);
  } catch (error: any) {
    console.error('Championship creation error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Championship for this year, season, and division already exists' });
    }
    res.status(500).json({ error: error.message || 'Failed to create championship' });
  }
});

// PUT update championship
router.put('/:id', async (req, res) => {
  try {
    const { year, season, division, tournament, title, jerseyUrl, altJerseyUrl, description, order } = req.body;

    const championship = await prisma.championship.update({
      where: { id: req.params.id },
      data: {
        ...(year && { year: parseInt(year) }),
        ...(season && { season }),
        ...(division && { division }),
        ...(tournament && { tournament }),
        ...(title && { title }),
        ...(jerseyUrl !== undefined && { jerseyUrl }),
        ...(altJerseyUrl !== undefined && { altJerseyUrl }),
        ...(description !== undefined && { description }),
        ...(order !== undefined && { order }),
      },
    });

    res.json(championship);
  } catch (error: any) {
    console.error('Championship update error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Championship not found' });
    }
    res.status(500).json({ error: error.message || 'Failed to update championship' });
  }
});

// DELETE championship
router.delete('/:id', async (req, res) => {
  try {
    await prisma.championship.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Championship not found' });
    }
    res.status(500).json({ error: 'Failed to delete championship' });
  }
});

export default router;
