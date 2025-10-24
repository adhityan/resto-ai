/*
  Warnings:

  - You are about to drop the `App` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AppAuthentication` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `basePath` on the `Restaurant` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "App_basePath_key";

-- DropIndex
DROP INDEX "AppAuthentication_clientId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "App";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AppAuthentication";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Restaurant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "incomingPhoneNumber" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Restaurant" ("createdAt", "id", "incomingPhoneNumber", "isActive", "name", "updatedAt") SELECT "createdAt", "id", "incomingPhoneNumber", "isActive", "name", "updatedAt" FROM "Restaurant";
DROP TABLE "Restaurant";
ALTER TABLE "new_Restaurant" RENAME TO "Restaurant";
CREATE INDEX "Restaurant_incomingPhoneNumber_idx" ON "Restaurant"("incomingPhoneNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
