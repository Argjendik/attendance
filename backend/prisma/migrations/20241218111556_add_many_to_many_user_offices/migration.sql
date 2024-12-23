/*
  Warnings:

  - You are about to drop the column `officeId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_officeId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "officeId";

-- CreateTable
CREATE TABLE "_UserOffices" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_UserOffices_AB_unique" ON "_UserOffices"("A", "B");

-- CreateIndex
CREATE INDEX "_UserOffices_B_index" ON "_UserOffices"("B");

-- AddForeignKey
ALTER TABLE "_UserOffices" ADD CONSTRAINT "_UserOffices_A_fkey" FOREIGN KEY ("A") REFERENCES "Office"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserOffices" ADD CONSTRAINT "_UserOffices_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
