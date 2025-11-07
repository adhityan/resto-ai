-- CreateTable
CREATE TABLE "SeatingArea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxCapacity" INTEGER NOT NULL,
    "restaurantId" TEXT NOT NULL,
    CONSTRAINT "SeatingArea_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SeatingArea_restaurantId_idx" ON "SeatingArea"("restaurantId");
