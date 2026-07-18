-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('NONE', 'SUPER_ADMIN', 'FINANCE', 'SUPPORT', 'ANALYST');

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "platformRole" "PlatformRole" NOT NULL DEFAULT 'NONE';
