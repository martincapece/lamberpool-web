-- Ensure Apertura 2026 (3ra Division) is marked as champion
INSERT INTO "championships" (
  "id",
  "year",
  "season",
  "division",
  "tournament",
  "title",
  "jerseyUrl",
  "altJerseyUrl",
  "description",
  "order",
  "createdAt",
  "updatedAt"
)
VALUES (
  'seed-2026-apertura-3ra',
  2026,
  'Apertura',
  '3ra División',
  'Liga Nuñez',
  'Campeonato',
  '/jerseys/2026-apertura.png',
  '/jerseys/2025-clausura.png',
  NULL,
  4,
  NOW(),
  NOW()
)
ON CONFLICT ("year", "season", "division")
DO UPDATE SET
  "tournament" = EXCLUDED."tournament",
  "title" = EXCLUDED."title",
  "jerseyUrl" = EXCLUDED."jerseyUrl",
  "altJerseyUrl" = EXCLUDED."altJerseyUrl",
  "order" = EXCLUDED."order",
  "updatedAt" = NOW();

-- Remove obsolete Clausura 2026 slot if it was previously inserted by mistake
DELETE FROM "championships"
WHERE "year" = 2026
  AND "season" = 'Clausura'
  AND "division" = '4ta División'
  AND "tournament" = 'Liga Nuñez'
  AND "order" = 4;
