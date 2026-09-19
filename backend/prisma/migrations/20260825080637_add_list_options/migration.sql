-- CreateTable
CREATE TABLE "ListOption" (
    "id" SERIAL NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ListOption_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ListOption" ADD CONSTRAINT "ListOption_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "FormField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
