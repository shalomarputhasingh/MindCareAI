-- CreateTable
CREATE TABLE "Journal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guestId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Mood" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guestId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Habit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guestId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ChatHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guestId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Journal_guestId_date_idx" ON "Journal"("guestId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Journal_guestId_date_key" ON "Journal"("guestId", "date");

-- CreateIndex
CREATE INDEX "Mood_guestId_date_idx" ON "Mood"("guestId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Mood_guestId_date_key" ON "Mood"("guestId", "date");

-- CreateIndex
CREATE INDEX "Habit_guestId_date_idx" ON "Habit"("guestId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Habit_guestId_date_name_key" ON "Habit"("guestId", "date", "name");

-- CreateIndex
CREATE INDEX "ChatHistory_guestId_createdAt_idx" ON "ChatHistory"("guestId", "createdAt");
