/*
  Warnings:

  - You are about to drop the column `zenchefReservationId` on the `Call` table. All the data in the column will be lost.

*/
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Call_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Call_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Call" ("createdAt", "customerId", "endTime", "escalationRequested", "id", "languages", "restaurantId", "startTime", "status", "updatedAt") SELECT "createdAt", "customerId", "endTime", "escalationRequested", "id", "languages", "restaurantId", "startTime", "status", "updatedAt" FROM "Call";
DROP TABLE "Call";
ALTER TABLE "new_Call" RENAME TO "Call";
CREATE INDEX "Call_restaurantId_idx" ON "Call"("restaurantId");
CREATE INDEX "Call_customerId_idx" ON "Call"("customerId");
CREATE INDEX "Call_status_idx" ON "Call"("status");
CREATE INDEX "Call_startTime_idx" ON "Call"("startTime");
CREATE TABLE "new_Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "zenchefBookingId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "numberOfGuests" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "comments" TEXT,
    "allergies" TEXT,
    "seatingAreaName" TEXT,
    "restaurantId" TEXT NOT NULL,
    "callId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reservation_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("allergies", "comments", "createdAt", "customerEmail", "customerName", "customerPhone", "date", "id", "numberOfGuests", "restaurantId", "seatingAreaName", "status", "time", "updatedAt", "zenchefBookingId") SELECT "allergies", "comments", "createdAt", "customerEmail", "customerName", "customerPhone", "date", "id", "numberOfGuests", "restaurantId", "seatingAreaName", "status", "time", "updatedAt", "zenchefBookingId" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE INDEX "Reservation_restaurantId_idx" ON "Reservation"("restaurantId");
CREATE INDEX "Reservation_restaurantId_date_idx" ON "Reservation"("restaurantId", "date");
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");
CREATE UNIQUE INDEX "Reservation_restaurantId_zenchefBookingId_key" ON "Reservation"("restaurantId", "zenchefBookingId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
