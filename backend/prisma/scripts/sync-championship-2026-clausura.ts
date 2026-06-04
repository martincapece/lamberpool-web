import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const apertura = await prisma.championship.upsert({
    where: {
      year_season_division: {
        year: 2026,
        season: 'Apertura',
        division: '3ra División',
      },
    },
    update: {
      tournament: 'Liga Nuñez',
      title: 'Campeonato',
      jerseyUrl: '/jerseys/2026-apertura.png',
      altJerseyUrl: '/jerseys/2025-clausura.png',
      order: 4,
    },
    create: {
      year: 2026,
      season: 'Apertura',
      division: '3ra División',
      tournament: 'Liga Nuñez',
      title: 'Campeonato',
      jerseyUrl: '/jerseys/2026-apertura.png',
      altJerseyUrl: '/jerseys/2025-clausura.png',
      order: 4,
    },
  });

  await prisma.championship.deleteMany({
    where: {
      year: 2026,
      season: 'Clausura',
      division: '4ta División',
      tournament: 'Liga Nuñez',
      order: 4,
      id: {
        not: apertura.id,
      },
    },
  });

  console.log('Updated 2026 Apertura (3ra Division) championship to Campeonato:', apertura.id);
}

main()
  .catch((error) => {
    console.error('Failed to sync Apertura 2026 championship:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
