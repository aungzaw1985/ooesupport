/*
  Warnings:

  - A unique constraint covering the columns `[leaderId]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deptId` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('ADMIN', 'MANAGER', 'TEAM_LEADER', 'AGENT');

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "role" "StaffRole" NOT NULL DEFAULT 'AGENT';

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "deptId" INTEGER NOT NULL,
ADD COLUMN     "leaderId" INTEGER;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "teamId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Team_leaderId_key" ON "Team"("leaderId");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_deptId_fkey" FOREIGN KEY ("deptId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
