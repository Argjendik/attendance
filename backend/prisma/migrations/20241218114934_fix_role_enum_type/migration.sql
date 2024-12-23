/*
  Warnings:

  - The primary key for the `_UserOffices` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_UserOffices` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "_UserOffices" DROP CONSTRAINT "_UserOffices_AB_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "_UserOffices_AB_unique" ON "_UserOffices"("A", "B");