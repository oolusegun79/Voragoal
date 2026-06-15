-- CreateTable
CREATE TABLE "FeedCallLog" (
    "key" TEXT NOT NULL,
    "lastCalledAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedCallLog_pkey" PRIMARY KEY ("key")
);
