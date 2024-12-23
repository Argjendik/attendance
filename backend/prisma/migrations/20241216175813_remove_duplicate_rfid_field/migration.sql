/*
  Warnings:

  - You are about to drop the column `rfidCard` on the `Agent` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Agent_rfidCard_key";

-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "rfidCard";
