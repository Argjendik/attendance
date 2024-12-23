-- AlterTable
ALTER TABLE "AttendanceRecord" ADD COLUMN     "lastCheckIn" TIMESTAMP(3),
ALTER COLUMN "workingHours" SET DATA TYPE TEXT;
