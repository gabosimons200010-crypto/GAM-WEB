-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "care" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "composition" TEXT;

-- AlterTable
ALTER TABLE "ProductMedia" ADD COLUMN     "label" TEXT;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "sizeChart" JSONB;
