-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "deptId" INTEGER;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_deptId_fkey" FOREIGN KEY ("deptId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
