/*
  Warnings:

  - You are about to drop the `_UserOffices` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_UserOffices" DROP CONSTRAINT "_UserOffices_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserOffices" DROP CONSTRAINT "_UserOffices_B_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "officeId" INTEGER;

-- DropTable
DROP TABLE "_UserOffices";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;
