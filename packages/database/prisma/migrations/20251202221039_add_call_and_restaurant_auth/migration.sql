-- CreateTable
CREATE TABLE "RestaurantAuthentication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "restaurantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RestaurantAuthentication_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Call" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "duration" INTEGER,
    "transcript" TEXT,
    "language" TEXT,
    "escalationRequested" BOOLEAN NOT NULL DEFAULT false,
    "customerId" TEXT,
    "restaurantId" TEXT NOT NULL,
    "zenchefReservationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Call_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Call_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantAuthentication_clientId_key" ON "RestaurantAuthentication"("clientId");

-- CreateIndex
CREATE INDEX "RestaurantAuthentication_restaurantId_idx" ON "RestaurantAuthentication"("restaurantId");

-- CreateIndex
CREATE INDEX "RestaurantAuthentication_clientId_idx" ON "RestaurantAuthentication"("clientId");

-- CreateIndex
CREATE INDEX "Call_restaurantId_idx" ON "Call"("restaurantId");

-- CreateIndex
CREATE INDEX "Call_customerId_idx" ON "Call"("customerId");

-- CreateIndex
CREATE INDEX "Call_status_idx" ON "Call"("status");

-- CreateIndex
CREATE INDEX "Call_startTime_idx" ON "Call"("startTime");
