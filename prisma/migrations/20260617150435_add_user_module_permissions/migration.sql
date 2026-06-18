-- CreateTable
CREATE TABLE "UserModulePermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserModulePermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UserModulePermission_userId_idx" ON "UserModulePermission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserModulePermission_userId_module_key" ON "UserModulePermission"("userId", "module");
