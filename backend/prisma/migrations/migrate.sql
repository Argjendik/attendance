-- Step 1: Create the new relation table
CREATE TABLE "_UserOffices" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- Step 2: Copy existing primary office relationships
INSERT INTO "_UserOffices" ("A", "B")
SELECT "id", "officeId"
FROM "User"
WHERE "officeId" IS NOT NULL;

-- Step 3: Copy existing HR office relationships
INSERT INTO "_UserOffices" ("A", "B")
SELECT "A", "B"
FROM "_HROffices"
ON CONFLICT DO NOTHING;

-- Step 4: Create the indices
CREATE UNIQUE INDEX "_UserOffices_AB_unique" ON "_UserOffices"("A", "B");
CREATE INDEX "_UserOffices_B_index" ON "_UserOffices"("B");

-- Step 5: Add foreign key constraints
ALTER TABLE "_UserOffices" ADD CONSTRAINT "_UserOffices_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_UserOffices" ADD CONSTRAINT "_UserOffices_B_fkey" FOREIGN KEY ("B") REFERENCES "Office"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Drop old relationships
ALTER TABLE "User" DROP COLUMN "officeId";
DROP TABLE "_HROffices"; 