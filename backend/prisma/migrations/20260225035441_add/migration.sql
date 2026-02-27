-- CreateTable
CREATE TABLE "championships" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "season" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "tournament" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "jerseyUrl" TEXT,
    "altJerseyUrl" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "championships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "championships_year_idx" ON "championships"("year");

-- CreateIndex
CREATE UNIQUE INDEX "championships_year_season_division_key" ON "championships"("year", "season", "division");
