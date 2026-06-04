import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create Lamberpool FC team
  const team = await prisma.team.upsert({
    where: { name: 'Lamberpool FC' },
    update: {},
    create: { name: 'Lamberpool FC' },
  });
  console.log('✓ Team created:', team.name);

  // Create judges
  const judges = ['Pato', 'Chicho', 'Cape', 'Stefa', 'Roña'];
  const createdJudges = await Promise.all(
    judges.map((name) =>
      prisma.judge.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );
  console.log('✓ Judges created:', judges.join(', '));

  // Create active tournament
  const tournament = await prisma.tournament.upsert({
    where: { teamId_name: { teamId: team.id, name: 'Liga Nuñez - Tercera División' } },
    update: {},
    create: {
      name: 'Liga Nuñez - Tercera División',
      teamId: team.id,
    },
  });
  console.log('✓ Tournament created:', tournament.name);

  // Create seasons for the tournament
  const season = await prisma.season.upsert({
    where: { tournamentId_year: { tournamentId: tournament.id, year: 2025 } },
    update: { isActive: true },
    create: {
      year: 2025,
      tournamentId: tournament.id,
      isActive: true,
    },
  });
  console.log('✓ Season created: 2025');

  // Create competition for this season
  const competition = await prisma.competition.upsert({
    where: { seasonId_name: { seasonId: season.id, name: 'Fase Regular' } },
    update: { isActive: true },
    create: {
      name: 'Fase Regular',
      seasonId: season.id,
      isActive: true,
    },
  });
  console.log('✓ Competition created: Fase Regular');

  // Create championships
  const championships = [
    {
      year: 2024,
      season: 'Clausura',
      division: '1ra División',
      tournament: 'Liga Castrol',
      title: 'Subcampeonato',
      jerseyUrl: '/jerseys/2024-clausura.png',
      order: 1,
    },
    {
      year: 2025,
      season: 'Apertura',
      division: '5ta División',
      tournament: 'Liga Nuñez',
      title: 'Subcampeonato',
      jerseyUrl: '/jerseys/2025-apertura.png',
      altJerseyUrl: '/jerseys/2024-clausura.png',
      order: 2,
    },
    {
      year: 2025,
      season: 'Clausura',
      division: '4ta División',
      tournament: 'Liga Nuñez',
      title: 'Campeonato',
      jerseyUrl: '/jerseys/2025-clausura.png',
      altJerseyUrl: '/jerseys/2025-apertura.png',
      order: 3,
    },
    {
      year: 2026,
      season: 'Apertura',
      division: '3ra División',
      tournament: 'Liga Nuñez',
      title: 'Campeonato',
      jerseyUrl: '/jerseys/2026-apertura.png',
      altJerseyUrl: '/jerseys/2025-clausura.png',
      order: 4,
    },
    {
      year: 2026,
      season: 'Anual',
      division: 'Copa Sudamericana',
      tournament: 'Internacional',
      title: 'Próximo',
      jerseyUrl: '/jerseys/2026-apertura.png',
      altJerseyUrl: '/jerseys/2025-clausura.png',
      order: 5,
    },
  ];

  for (const champ of championships) {
    await prisma.championship.upsert({
      where: { year_season_division: { year: champ.year, season: champ.season, division: champ.division } },
      update: {
        tournament: champ.tournament,
        title: champ.title,
        jerseyUrl: champ.jerseyUrl,
        altJerseyUrl: champ.altJerseyUrl || null,
        order: champ.order,
      },
      create: champ,
    });
  }
  console.log('✓ Championships created');

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
