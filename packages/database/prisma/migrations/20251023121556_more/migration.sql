-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Restaurant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "incomingPhoneNumber" TEXT NOT NULL,
    "zenchefId" TEXT NOT NULL DEFAULT '378114',
    "apiToken" TEXT NOT NULL DEFAULT 'e3469030-41fc-4ec3-8754-10f333fde782',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Restaurant" ("createdAt", "id", "incomingPhoneNumber", "isActive", "name", "updatedAt") SELECT "createdAt", "id", "incomingPhoneNumber", "isActive", "name", "updatedAt" FROM "Restaurant";
DROP TABLE "Restaurant";
ALTER TABLE "new_Restaurant" RENAME TO "Restaurant";
CREATE INDEX "Restaurant_incomingPhoneNumber_idx" ON "Restaurant"("incomingPhoneNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
