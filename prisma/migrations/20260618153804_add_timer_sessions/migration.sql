-- CreateTable
CREATE TABLE "TimerSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "startedAt" DATETIME NOT NULL,
    "pausedAt" DATETIME,
    "resumedAt" DATETIME,
    "stoppedAt" DATETIME,
    "totalPausedSeconds" INTEGER NOT NULL DEFAULT 0,
    "elapsedSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdTimeEntryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TimerSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dailyGoalHours" REAL NOT NULL DEFAULT 8,
    "weeklyGoalHours" REAL NOT NULL DEFAULT 40,
    "monthlyGoalHours" REAL NOT NULL DEFAULT 176,
    "allowNegativeBalance" BOOLEAN NOT NULL DEFAULT true,
    "timerRoundingMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserSettings" ("allowNegativeBalance", "createdAt", "dailyGoalHours", "id", "monthlyGoalHours", "updatedAt", "userId", "weeklyGoalHours") SELECT "allowNegativeBalance", "createdAt", "dailyGoalHours", "id", "monthlyGoalHours", "updatedAt", "userId", "weeklyGoalHours" FROM "UserSettings";
DROP TABLE "UserSettings";
ALTER TABLE "new_UserSettings" RENAME TO "UserSettings";
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TimerSession_userId_idx" ON "TimerSession"("userId");

-- CreateIndex
CREATE INDEX "TimerSession_status_idx" ON "TimerSession"("status");

-- CreateIndex
CREATE INDEX "TimerSession_startedAt_idx" ON "TimerSession"("startedAt");
