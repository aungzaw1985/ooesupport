/*
  Warnings:

  - Added the required column `subject` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "subject" TEXT NOT NULL DEFAULT 'Migrated Ticket';
