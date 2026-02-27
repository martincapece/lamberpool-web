-- CreateTable
CREATE TABLE "guest_judges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_judges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_ratings" (
    "id" TEXT NOT NULL,
    "matchPlayerId" TEXT NOT NULL,
    "guestJudgeId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guest_ratings_matchPlayerId_guestJudgeId_key" ON "guest_ratings"("matchPlayerId", "guestJudgeId");

-- AddForeignKey
ALTER TABLE "guest_judges" ADD CONSTRAINT "guest_judges_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_ratings" ADD CONSTRAINT "guest_ratings_matchPlayerId_fkey" FOREIGN KEY ("matchPlayerId") REFERENCES "match_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_ratings" ADD CONSTRAINT "guest_ratings_guestJudgeId_fkey" FOREIGN KEY ("guestJudgeId") REFERENCES "guest_judges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
