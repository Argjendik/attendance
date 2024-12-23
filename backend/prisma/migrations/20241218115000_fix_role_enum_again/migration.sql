-- First, remove the default value
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

-- Then, temporarily change the role column to text
ALTER TABLE "User" ALTER COLUMN "role" TYPE text;

-- Drop existing Role enum if it exists
DROP TYPE IF EXISTS "Role" CASCADE;

-- Create Role enum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'HR', 'AGENT');

-- Modify User table to use Role enum
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::"Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ADMIN'::"Role"; 