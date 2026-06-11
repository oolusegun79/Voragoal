-- AlterTable
ALTER TABLE "Player" ADD COLUMN "externalApiId" TEXT;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN "externalApiId" TEXT;

-- AlterTable
ALTER TABLE "MatchEvent" ADD COLUMN "externalEventKey" TEXT;
ALTER TABLE "MatchEvent" ADD COLUMN "importedFromFeed" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Player_teamId_externalApiId_idx" ON "Player"("teamId", "externalApiId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchEvent_matchId_externalEventKey_key" ON "MatchEvent"("matchId", "externalEventKey");
