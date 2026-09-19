-- CreateEnum
CREATE TYPE "KbRole" AS ENUM ('NONE', 'KB_CREATOR', 'KB_REVIEWER', 'KB_APPROVER');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED');

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "kbPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "kbRole" "KbRole" NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "KbBrand" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "KbBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KbProduct" (
    "id" SERIAL NOT NULL,
    "brandId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "KbProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KbModel" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "KbModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KbArticle" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "modelId" INTEGER NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "reviewerId" INTEGER,
    "approverId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KbArticle_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KbProduct" ADD CONSTRAINT "KbProduct_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "KbBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KbModel" ADD CONSTRAINT "KbModel_productId_fkey" FOREIGN KEY ("productId") REFERENCES "KbProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KbArticle" ADD CONSTRAINT "KbArticle_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "KbModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KbArticle" ADD CONSTRAINT "KbArticle_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KbArticle" ADD CONSTRAINT "KbArticle_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KbArticle" ADD CONSTRAINT "KbArticle_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
