-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

-- CreateTable
CREATE TABLE "_HROffices" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_HROffices_AB_unique" ON "_HROffices"("A", "B");

-- CreateIndex
CREATE INDEX "_HROffices_B_index" ON "_HROffices"("B");

-- AddForeignKey
ALTER TABLE "_HROffices" ADD CONSTRAINT "_HROffices_A_fkey" FOREIGN KEY ("A") REFERENCES "Office"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HROffices" ADD CONSTRAINT "_HROffices_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
