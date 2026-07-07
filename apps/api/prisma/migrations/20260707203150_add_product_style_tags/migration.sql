-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "styleTags" TEXT[] DEFAULT ARRAY[]::TEXT[];
