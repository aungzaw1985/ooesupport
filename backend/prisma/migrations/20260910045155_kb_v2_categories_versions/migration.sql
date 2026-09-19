/*
  Warnings:

  - You are about to drop the column `content` on the `KbArticle` table. All the data in the column will be lost.
  - You are about to drop the column `modelId` on the `KbArticle` table. All the data in the column will be lost.
  - You are about to drop the `KbBrand` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `KbModel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `KbProduct` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `publicContent` to the `KbArticle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sectionId` to the `KbArticle` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "KbArticle" DROP CONSTRAINT "KbArticle_modelId_fkey";

-- DropForeignKey
ALTER TABLE "KbModel" DROP CONSTRAINT "KbModel_productId_fkey";

-- DropForeignKey
ALTER TABLE "KbProduct" DROP CONSTRAINT "KbProduct_brandId_fkey";

-- AlterTable
ALTER TABLE "KbArticle" DROP COLUMN "content",
DROP COLUMN "modelId",
ADD COLUMN     "internalContent" TEXT,
ADD COLUMN     "isStale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicContent" TEXT NOT NULL,
ADD COLUMN     "sectionId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "KbBrand";

-- DropTable
DROP TABLE "KbModel";

-- DropTable
DROP TABLE "KbProduct";

-- CreateTable
CREATE TABLE "KbArticleVersion" (
    "id" SERIAL NOT NULL,
    "articleId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "editedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KbArticleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KbCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "KbCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KbSection" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "KbSection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KbArticle" ADD CONSTRAINT "KbArticle_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "KbSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KbArticleVersion" ADD CONSTRAINT "KbArticleVersion_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "KbArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KbArticleVersion" ADD CONSTRAINT "KbArticleVersion_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KbSection" ADD CONSTRAINT "KbSection_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "KbCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
