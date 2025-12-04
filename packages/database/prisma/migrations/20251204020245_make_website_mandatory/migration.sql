-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Restaurant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "information" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "incomingPhoneNumber" TEXT NOT NULL,
    "maxSeatingAllowedBeforeEscalation" INTEGER NOT NULL DEFAULT 12,
    "zenchefId" TEXT NOT NULL,
    "apiToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Restaurant" ("apiToken", "createdAt", "id", "incomingPhoneNumber", "information", "isActive", "maxSeatingAllowedBeforeEscalation", "name", "updatedAt", "website", "zenchefId") SELECT "apiToken", "createdAt", "id", "incomingPhoneNumber", "information", "isActive", "maxSeatingAllowedBeforeEscalation", "name", "updatedAt", "website", "zenchefId" FROM "Restaurant";
DROP TABLE "Restaurant";
ALTER TABLE "new_Restaurant" RENAME TO "Restaurant";
CREATE UNIQUE INDEX "Restaurant_zenchefId_key" ON "Restaurant"("zenchefId");
CREATE UNIQUE INDEX "Restaurant_apiToken_key" ON "Restaurant"("apiToken");
CREATE INDEX "Restaurant_incomingPhoneNumber_idx" ON "Restaurant"("incomingPhoneNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
