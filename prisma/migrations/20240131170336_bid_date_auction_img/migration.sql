-- AlterTable
ALTER TABLE "auctions" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "bids" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
