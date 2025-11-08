/*
  Warnings:

  - Added the required column `zenchefRoomId` to the `SeatingArea` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SeatingArea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxCapacity" INTEGER NOT NULL,
    "zenchefRoomId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    CONSTRAINT "SeatingArea_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SeatingArea" ("description", "id", "maxCapacity", "name", "restaurantId") SELECT "description", "id", "maxCapacity", "name", "restaurantId" FROM "SeatingArea";
DROP TABLE "SeatingArea";
ALTER TABLE "new_SeatingArea" RENAME TO "SeatingArea";
CREATE INDEX "SeatingArea_restaurantId_idx" ON "SeatingArea"("restaurantId");
CREATE UNIQUE INDEX "SeatingArea_restaurantId_zenchefRoomId_key" ON "SeatingArea"("restaurantId", "zenchefRoomId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
