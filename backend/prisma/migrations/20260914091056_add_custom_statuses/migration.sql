/*
  Warnings:

  - The `status` column on the `Ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OPEN';

-- DropEnum
DROP TYPE "TicketStatus";

-- CreateTable
CREATE TABLE "TicketStatusConfig" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "isClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TicketStatusConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketStatusConfig_name_key" ON "TicketStatusConfig"("name");
