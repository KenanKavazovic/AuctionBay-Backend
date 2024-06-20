-- AlterTable
ALTER TABLE "auctions"
ALTER COLUMN "startedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "endedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "title" SET DATA TYPE TEXT;

ALTER TABLE "auctions" RENAME CONSTRAINT "PK_auctions" TO "auctions_pkey";

-- AlterTable
ALTER TABLE "bids" RENAME CONSTRAINT "PK_bids" TO "bids_pkey";

-- AlterTable
ALTER TABLE "users"
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "email" SET DATA TYPE TEXT,
ALTER COLUMN "password" SET DATA TYPE TEXT,
ALTER COLUMN "firstName" SET DATA TYPE TEXT,
ALTER COLUMN "lastName" SET DATA TYPE TEXT,
ALTER COLUMN "avatar" SET DATA TYPE TEXT,
ALTER COLUMN "refreshToken" SET DATA TYPE TEXT;


ALTER TABLE "users" RENAME CONSTRAINT "PK_users" TO "users_pkey";
-- RenameForeignKey
ALTER TABLE "auctions" RENAME CONSTRAINT "Relationship4" TO "auctions_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "bids" RENAME CONSTRAINT "Relationship1" TO "bids_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "bids" RENAME CONSTRAINT "Relationship2" TO "bids_auction_id_fkey";

-- RenameIndex
ALTER INDEX "IX_Relationship4" RENAME TO "auctions_user_id_idx";

-- RenameIndex
ALTER INDEX "IX_Relationship1" RENAME TO "bids_user_id_idx";

-- RenameIndex
ALTER INDEX "IX_Relationship2" RENAME TO "bids_auction_id_idx";

-- RenameIndex
ALTER INDEX "email" RENAME TO "users_email_key";
