/*
  Warnings:

  - A unique constraint covering the columns `[rfidCard]` on the table `Agent` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "rfidCard" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Agent_rfidCard_key" ON "Agent"("rfidCard");
