/*
  Warnings:

  - You are about to drop the column `officeId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `_HROffices` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_officeId_fkey";

-- DropForeignKey
ALTER TABLE "_HROffices" DROP CONSTRAINT "_HROffices_A_fkey";

-- DropForeignKey
ALTER TABLE "_HROffices" DROP CONSTRAINT "_HROffices_B_fkey";

-- DropForeignKey
ALTER TABLE "_UserOffices" DROP CONSTRAINT "_UserOffices_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserOffices" DROP CONSTRAINT "_UserOffices_B_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "officeId";

-- DropTable
DROP TABLE "_HROffices";

-- AddForeignKey
ALTER TABLE "_UserOffices" ADD CONSTRAINT "_UserOffices_A_fkey" FOREIGN KEY ("A") REFERENCES "Office"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserOffices" ADD CONSTRAINT "_UserOffices_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
