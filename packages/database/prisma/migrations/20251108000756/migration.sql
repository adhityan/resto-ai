/*
  Warnings:

  - You are about to alter the column `zenchefRoomId` on the `SeatingArea` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Restaurant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "incomingPhoneNumber" TEXT NOT NULL,
    "maxEscalationSeating" INTEGER NOT NULL DEFAULT 12,
    "zenchefId" TEXT NOT NULL,
    "apiToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Restaurant" ("apiToken", "createdAt", "id", "incomingPhoneNumber", "isActive", "name", "updatedAt", "zenchefId") SELECT "apiToken", "createdAt", "id", "incomingPhoneNumber", "isActive", "name", "updatedAt", "zenchefId" FROM "Restaurant";
DROP TABLE "Restaurant";
ALTER TABLE "new_Restaurant" RENAME TO "Restaurant";
CREATE UNIQUE INDEX "Restaurant_zenchefId_key" ON "Restaurant"("zenchefId");
CREATE UNIQUE INDEX "Restaurant_apiToken_key" ON "Restaurant"("apiToken");
CREATE INDEX "Restaurant_incomingPhoneNumber_idx" ON "Restaurant"("incomingPhoneNumber");
CREATE TABLE "new_SeatingArea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxCapacity" INTEGER NOT NULL,
    "zenchefRoomId" INTEGER NOT NULL,
    "restaurantId" TEXT NOT NULL,
    CONSTRAINT "SeatingArea_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SeatingArea" ("description", "id", "maxCapacity", "name", "restaurantId", "zenchefRoomId") SELECT "description", "id", "maxCapacity", "name", "restaurantId", "zenchefRoomId" FROM "SeatingArea";
DROP TABLE "SeatingArea";
ALTER TABLE "new_SeatingArea" RENAME TO "SeatingArea";
CREATE INDEX "SeatingArea_restaurantId_idx" ON "SeatingArea"("restaurantId");
CREATE UNIQUE INDEX "SeatingArea_restaurantId_zenchefRoomId_key" ON "SeatingArea"("restaurantId", "zenchefRoomId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
