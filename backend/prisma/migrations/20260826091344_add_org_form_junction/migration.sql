/*
  Warnings:

  - You are about to drop the column `orgId` on the `Form` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Form" DROP CONSTRAINT "Form_orgId_fkey";

-- AlterTable
ALTER TABLE "Form" DROP COLUMN "orgId";

-- CreateTable
CREATE TABLE "OrganizationForm" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER NOT NULL,
    "formId" INTEGER NOT NULL,

    CONSTRAINT "OrganizationForm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationForm_orgId_formId_key" ON "OrganizationForm"("orgId", "formId");

-- AddForeignKey
ALTER TABLE "OrganizationForm" ADD CONSTRAINT "OrganizationForm_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationForm" ADD CONSTRAINT "OrganizationForm_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
