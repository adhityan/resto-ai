-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CallTranscript" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "speaker" TEXT NOT NULL,
    "contents" TEXT NOT NULL,
    "wasInterupted" BOOLEAN NOT NULL DEFAULT false,
    "time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "callId" TEXT NOT NULL,
    CONSTRAINT "CallTranscript_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CallTranscript" ("callId", "contents", "id", "speaker", "time") SELECT "callId", "contents", "id", "speaker", "time" FROM "CallTranscript";
DROP TABLE "CallTranscript";
ALTER TABLE "new_CallTranscript" RENAME TO "CallTranscript";
CREATE INDEX "CallTranscript_callId_idx" ON "CallTranscript"("callId");
CREATE INDEX "CallTranscript_callId_time_idx" ON "CallTranscript"("callId", "time");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
