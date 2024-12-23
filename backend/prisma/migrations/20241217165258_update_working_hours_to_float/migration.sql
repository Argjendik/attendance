/*
  Warnings:

  - The `workingHours` column on the `AttendanceRecord` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "AttendanceRecord" DROP COLUMN "workingHours",
ADD COLUMN     "workingHours" DOUBLE PRECISION;
