-- CreateTable
CREATE TABLE "WordList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Phoneme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "example" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listId" TEXT NOT NULL,
    "english" TEXT NOT NULL,
    "englishKey" TEXT NOT NULL,
    "hint" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Word_listId_fkey" FOREIGN KEY ("listId") REFERENCES "WordList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WordSound" (
    "wordId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "phonemeId" TEXT NOT NULL,

    PRIMARY KEY ("wordId", "position"),
    CONSTRAINT "WordSound_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WordSound_phonemeId_fkey" FOREIGN KEY ("phonemeId") REFERENCES "Phoneme" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Difficulty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "directions" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "wordId" TEXT,
    "hints" BOOLEAN NOT NULL DEFAULT true,
    "labels" BOOLEAN NOT NULL DEFAULT true,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "seed" INTEGER NOT NULL DEFAULT 42,
    "rows" INTEGER NOT NULL DEFAULT 10,
    "cols" INTEGER NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Activity_listId_fkey" FOREIGN KEY ("listId") REFERENCES "WordList" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Activity_difficulty_fkey" FOREIGN KEY ("difficulty") REFERENCES "Difficulty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Activity_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityWord" (
    "activityId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    PRIMARY KEY ("activityId", "wordId"),
    CONSTRAINT "ActivityWord_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeedState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Phoneme_symbol_key" ON "Phoneme"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Word_listId_englishKey_key" ON "Word"("listId", "englishKey");

-- CreateIndex
CREATE INDEX "WordSound_phonemeId_idx" ON "WordSound"("phonemeId");

-- CreateIndex
CREATE INDEX "Activity_listId_idx" ON "Activity"("listId");

-- CreateIndex
CREATE INDEX "Activity_wordId_idx" ON "Activity"("wordId");

-- CreateIndex
CREATE INDEX "Activity_difficulty_idx" ON "Activity"("difficulty");

-- CreateIndex
CREATE INDEX "ActivityWord_wordId_idx" ON "ActivityWord"("wordId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityWord_activityId_position_key" ON "ActivityWord"("activityId", "position");
