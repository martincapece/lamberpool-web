-- Add support for canceled matches and normalize stored date-only values.
CREATE TYPE "MatchStatus" AS ENUM ('PLAYED', 'CANCELED');

ALTER TABLE "matches"
ADD COLUMN "status" "MatchStatus" NOT NULL DEFAULT 'PLAYED',
ADD COLUMN "awardedTo" TEXT,
ADD COLUMN "cancelReason" TEXT;