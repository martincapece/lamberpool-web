import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET filter options (years, tournaments, competitions)
router.get('/options', async (req, res) => {
  try {
    // Get all seasons with their tournaments
    const seasons = await prisma.season.findMany({
      include: {
        tournament: true,
        competitions: true,
      },
      orderBy: {
        year: 'desc',
      },
    });

    // Extract unique years
    const years = [...new Set(seasons.map(s => s.year))].sort((a, b) => Number(b) - Number(a));

    // Extract tournaments with their info
    const tournamentsMap = new Map();
    seasons.forEach(season => {
      if (!tournamentsMap.has(season.tournament.id)) {
        tournamentsMap.set(season.tournament.id, {
          id: season.tournament.id,
          name: season.tournament.name,
        });
      }
    });
    const tournaments = Array.from(tournamentsMap.values());

    // Extract competitions with their context
    const competitions = seasons.flatMap(season =>
      season.competitions.map(comp => ({
        id: comp.id,
        name: comp.name,
        seasonYear: season.year,
        tournamentName: season.tournament.name,
        fullName: `${season.tournament.name} ${season.year} - ${comp.name}`,
      }))
    );

    res.json({
      years,
      tournaments,
      competitions,
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

export default router;
