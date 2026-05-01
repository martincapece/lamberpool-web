import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

const parseMatchDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  // Store date-only values at UTC noon to avoid timezone shifts when users pick YYYY-MM-DD.
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
};

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const getMatchResult = (goalsFor: number, goalsAgainst: number) => {
  if (goalsFor > goalsAgainst) return 'W';
  if (goalsFor < goalsAgainst) return 'L';
  return 'D';
};

const buildMatchPayload = (source: any, fallback?: any) => {
  const status = source.status ?? fallback?.status ?? 'PLAYED';
  const awardedTo = normalizeText(source.awardedTo) ?? (status === 'CANCELED' ? fallback?.awardedTo : undefined);
  const cancelReason = status === 'CANCELED' ? normalizeText(source.cancelReason) ?? fallback?.cancelReason ?? null : null;
  const opponent = normalizeText(source.opponent) ?? fallback?.opponent;
  const rawDate = source.date ?? fallback?.date;
  const parsedDate = typeof rawDate === 'string' ? parseMatchDate(rawDate) : rawDate instanceof Date ? rawDate : null;

  if (!opponent || !parsedDate) {
    return { error: 'Missing required fields' };
  }

  let goalsFor = source.goalsFor ?? fallback?.goalsFor ?? 0;
  let goalsAgainst = source.goalsAgainst ?? fallback?.goalsAgainst ?? 0;

  if (status === 'CANCELED') {
    if (awardedTo !== 'LAMBERPOOL' && awardedTo !== 'OPPONENT') {
      return { error: 'awardedTo must be LAMBERPOOL or OPPONENT when the match is canceled' };
    }

    goalsFor = awardedTo === 'LAMBERPOOL' ? 3 : 0;
    goalsAgainst = awardedTo === 'LAMBERPOOL' ? 0 : 3;
  }

  return {
    data: {
      opponent,
      date: parsedDate,
      goalsFor: Number(goalsFor),
      goalsAgainst: Number(goalsAgainst),
      result: getMatchResult(Number(goalsFor), Number(goalsAgainst)),
      status,
      awardedTo: status === 'CANCELED' ? awardedTo : null,
      cancelReason,
      youtubeUrl: source.youtubeUrl !== undefined ? normalizeText(source.youtubeUrl) ?? null : fallback?.youtubeUrl,
    },
  };
};

// GET all matches
router.get('/', async (req, res) => {
  try {
    const { competitionId, teamId } = req.query;

    const matches = await prisma.match.findMany({
      where: {
        ...(competitionId && { competitionId: competitionId as string }),
        ...(teamId && { teamId: teamId as string }),
      },
      select: {
        id: true,
        opponent: true,
        date: true,
        goalsFor: true,
        goalsAgainst: true,
        result: true,
        status: true,
        awardedTo: true,
        cancelReason: true,
        youtubeUrl: true,
        competition: {
          select: {
            id: true,
            name: true,
            season: {
              select: {
                id: true,
                year: true,
                tournament: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Short public cache to reduce repeated reads and perceived latency.
    res.set('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=120');

    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// GET match by ID
router.get('/:id', async (req, res) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: {
        matchPlayers: {
          include: {
            player: true,
            ratings: { include: { judge: true } },
            guestRatings: { include: { guestJudge: true } },
          },
        },
        photos: true,
        competition: { include: { season: { include: { tournament: true } } } },
      },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(match);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

// POST create match
router.post('/', async (req, res) => {
  try {
    const { competitionId, teamId, opponent, date, goalsFor, goalsAgainst } = req.body;

    if (!competitionId || !teamId || !opponent || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const payload = buildMatchPayload(req.body);
    if ('error' in payload) {
      return res.status(400).json({ error: payload.error });
    }

    const match = await prisma.match.create({
      data: {
        competitionId,
        teamId,
        ...payload.data,
      },
      include: {
        matchPlayers: { 
          include: { 
            player: true, 
            ratings: { include: { judge: true } },
            guestRatings: { include: { guestJudge: true } },
          } 
        },
        photos: true,
      },
    });

    res.status(201).json(match);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create match' });
  }
});

// PUT update match
router.put('/:id', async (req, res) => {
  try {
    const existingMatch = await prisma.match.findUnique({
      where: { id: req.params.id },
    });

    if (!existingMatch) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const payload = buildMatchPayload(req.body, existingMatch);
    if ('error' in payload) {
      return res.status(400).json({ error: payload.error });
    }

    const match = await prisma.match.update({
      where: { id: req.params.id },
      data: payload.data,
      include: {
        matchPlayers: {
          include: {
            player: true,
            ratings: { include: { judge: true } },
          },
        },
        photos: true,
      },
    });

    res.json(match);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update match' });
  }
});

// DELETE match by ID
router.delete('/:id', async (req, res) => {
  try {
    const matchId = req.params.id;

    await prisma.$transaction(async (tx) => {
      const matchPlayers = await tx.matchPlayer.findMany({
        where: { matchId },
        select: { id: true },
      });

      if (matchPlayers.length > 0) {
        const matchPlayerIds = matchPlayers.map((mp) => mp.id);
        await tx.rating.deleteMany({
          where: { matchPlayerId: { in: matchPlayerIds } },
        });
        await tx.guestRating.deleteMany({
          where: { matchPlayerId: { in: matchPlayerIds } },
        });
        await tx.matchPlayer.deleteMany({
          where: { id: { in: matchPlayerIds } },
        });
      }

      await tx.guestJudge.deleteMany({
        where: { matchId },
      });

      await tx.photo.deleteMany({
        where: { matchId },
      });

      await tx.match.delete({
        where: { id: matchId },
      });
    });

    res.json({ message: 'Match deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

// DELETE all matches (optionally filtered by competitionId)
router.delete('/', async (req, res) => {
  try {
    const { competitionId } = req.query;

    const matches = await prisma.match.findMany({
      where: competitionId ? { competitionId: competitionId as string } : undefined,
      select: { id: true },
    });

    if (matches.length === 0) {
      return res.json({ deleted: 0 });
    }

    const matchIds = matches.map((m) => m.id);

    await prisma.$transaction(async (tx) => {
      const matchPlayers = await tx.matchPlayer.findMany({
        where: { matchId: { in: matchIds } },
        select: { id: true },
      });

      if (matchPlayers.length > 0) {
        const matchPlayerIds = matchPlayers.map((mp) => mp.id);
        await tx.rating.deleteMany({
          where: { matchPlayerId: { in: matchPlayerIds } },
        });
        await tx.guestRating.deleteMany({
          where: { matchPlayerId: { in: matchPlayerIds } },
        });
        await tx.matchPlayer.deleteMany({
          where: { id: { in: matchPlayerIds } },
        });
      }

      await tx.guestJudge.deleteMany({
        where: { matchId: { in: matchIds } },
      });

      await tx.photo.deleteMany({
        where: { matchId: { in: matchIds } },
      });

      await tx.match.deleteMany({
        where: { id: { in: matchIds } },
      });
    });

    res.json({ deleted: matchIds.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete matches' });
  }
});

export default router;
