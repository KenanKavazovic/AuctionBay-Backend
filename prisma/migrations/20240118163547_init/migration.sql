-- CreateTable
CREATE TABLE "auctions" (
    "auction_id" SERIAL NOT NULL,
    "startedAt" TIMESTAMP(6) NOT NULL,
    "endedAt" TIMESTAMP(6) NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "startingPrice" INTEGER NOT NULL,
    "user_id" INTEGER,

    CONSTRAINT "PK_auctions" PRIMARY KEY ("auction_id")
);

-- CreateTable
CREATE TABLE "bids" (
    "bid_id" SERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "user_id" INTEGER,
    "auction_id" INTEGER,

    CONSTRAINT "PK_bids" PRIMARY KEY ("bid_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(100) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "avatar" VARCHAR,
    "refreshToken" VARCHAR,

    CONSTRAINT "PK_users" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "IX_Relationship4" ON "auctions"("user_id");

-- CreateIndex
CREATE INDEX "IX_Relationship1" ON "bids"("user_id");

-- CreateIndex
CREATE INDEX "IX_Relationship2" ON "bids"("auction_id");

-- CreateIndex
CREATE UNIQUE INDEX "email" ON "users"("email");

-- AddForeignKey
ALTER TABLE "auctions" ADD CONSTRAINT "Relationship4" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "Relationship1" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "Relationship2" FOREIGN KEY ("auction_id") REFERENCES "auctions"("auction_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
