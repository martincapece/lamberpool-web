import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const hasFlag = (flag: string) => process.argv.includes(flag);

const dryRun = hasFlag('--dry-run') || !hasFlag('--apply');
const reverse = hasFlag('--reverse');
const deltaDays = reverse ? -1 : 1;

const shiftDate = (date: Date, days: number) => {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
};

async function main() {
  const matches = await prisma.match.findMany({
    select: {
      id: true,
      opponent: true,
      date: true,
    },
    orderBy: {
      date: 'desc',
    },
  });

  if (matches.length === 0) {
    console.log('No matches found. Nothing to update.');
    return;
  }

  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'APPLY'}`);
  console.log(`Direction: ${deltaDays > 0 ? '+1 day' : '-1 day'}`);
  console.log(`Matches found: ${matches.length}`);

  const preview = matches.slice(0, 10).map((match) => ({
    id: match.id,
    opponent: match.opponent,
    currentDate: match.date.toISOString(),
    newDate: shiftDate(match.date, deltaDays).toISOString(),
  }));

  console.table(preview);

  if (dryRun) {
    console.log('Dry-run complete. Re-run with --apply to persist changes.');
    return;
  }

  await prisma.$transaction(
    matches.map((match) =>
      prisma.match.update({
        where: { id: match.id },
        data: {
          date: shiftDate(match.date, deltaDays),
          updatedAt: new Date(),
        },
      })
    )
  );

  console.log(`Updated ${matches.length} matches successfully.`);
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
