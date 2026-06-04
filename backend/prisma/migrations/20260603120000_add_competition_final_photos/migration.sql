-- Create table for multiple final photos per competition
CREATE TABLE "competition_final_photos" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competition_final_photos_pkey" PRIMARY KEY ("id")
);

-- Create index for relation lookups
CREATE INDEX "competition_final_photos_competitionId_idx" ON "competition_final_photos"("competitionId");

-- Add relation constraint
ALTER TABLE "competition_final_photos"
ADD CONSTRAINT "competition_final_photos_competitionId_fkey"
FOREIGN KEY ("competitionId") REFERENCES "competitions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill legacy single-photo data into the new gallery table
INSERT INTO "competition_final_photos" ("id", "competitionId", "url", "order")
SELECT
  'legacy-' || c."id",
  c."id",
  c."finalTablePhotoUrl",
  0
FROM "competitions" c
WHERE c."finalTablePhotoUrl" IS NOT NULL
  AND c."finalTablePhotoUrl" <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM "competition_final_photos" p
    WHERE p."competitionId" = c."id"
  );
