-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "ticketPrefix" TEXT DEFAULT 'TCK',
ADD COLUMN     "ticketSeqType" TEXT DEFAULT 'SEQUENTIAL';

-- CreateTable
CREATE TABLE "Sequence" (
    "prefix" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Sequence_pkey" PRIMARY KEY ("prefix")
);
