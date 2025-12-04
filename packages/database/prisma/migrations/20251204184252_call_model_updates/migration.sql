/*
  Warnings:

  - You are about to drop the column `duration` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `Call` table. All the data in the column will be lost.
  - You are about to drop the column `transcript` on the `Call` table. All the data in the column will be lost.
  - Added the required column `languages` to the `Call` table without a default value. This is not possible if the table is not empty.
  - Made the column `customerId` on table `Call` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "CallTranscript" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "speaker" TEXT NOT NULL,
    "contents" TEXT NOT NULL,
    "time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "callId" TEXT NOT NULL,
    CONSTRAINT "CallTranscript_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Call" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "languages" TEXT NOT NULL,
    "escalationRequested" BOOLEAN NOT NULL DEFAULT false,
    "customerId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "zenchefReservationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Call_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Call_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Call" ("createdAt", "customerId", "endTime", "escalationRequested", "id", "restaurantId", "startTime", "status", "updatedAt", "zenchefReservationId") SELECT "createdAt", "customerId", "endTime", "escalationRequested", "id", "restaurantId", "startTime", "status", "updatedAt", "zenchefReservationId" FROM "Call";
DROP TABLE "Call";
ALTER TABLE "new_Call" RENAME TO "Call";
CREATE INDEX "Call_restaurantId_idx" ON "Call"("restaurantId");
CREATE INDEX "Call_customerId_idx" ON "Call"("customerId");
CREATE INDEX "Call_status_idx" ON "Call"("status");
CREATE INDEX "Call_startTime_idx" ON "Call"("startTime");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CallTranscript_callId_idx" ON "CallTranscript"("callId");

-- CreateIndex
CREATE INDEX "CallTranscript_callId_time_idx" ON "CallTranscript"("callId", "time");
