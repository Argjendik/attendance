-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE "_UserOffices" ADD CONSTRAINT "_UserOffices_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_UserOffices_AB_unique";
