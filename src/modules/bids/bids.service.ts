import { BadRequestException, Injectable } from '@nestjs/common';
import { Bid, Prisma, User } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import Logging from 'src/library/Logging';

@Injectable()
export class BidsService {
  constructor (private readonly prisma: DatabaseService) {}

  async create(createBidDto: Prisma.BidCreateInput, user: User, auction_id: number): Promise<Bid> {
    const auction = await this.prisma.auction.findUnique({
      where: {
        auction_id
      }
    })
    if (!auction) {
      throw new BadRequestException('Auction not found.');
    }
    if (auction.endedAt && new Date(auction.endedAt) < new Date()) {
      Logging.warn('You cannot place a bid on an auction that has already ended.');
      throw new BadRequestException('You cannot place a bid on an auction that has already ended.');
    }
    const highestBid = await this.prisma.bid.findFirst({
      where: {
        auction_id
      },
      orderBy: {
        amount: 'desc'
      }
    })
    const latestBid = await this.prisma.bid.findFirst({
      where: {
        auction_id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    if (latestBid && latestBid.user_id === user.user_id) {
      Logging.warn('You cannot place two consecutive bids on the same auction.');
      throw new BadRequestException('You cannot place two consecutive bids on the same auction.');
    }
    if (auction.startingPrice > createBidDto.amount) {
      Logging.warn('Your desired bid was too low, you must bid higher than the starting price.')
      throw new BadRequestException('Your bid must be higher than the starting price.');
    } else if(highestBid && highestBid.amount >= createBidDto.amount) {
      Logging.warn('Your desired bid was too low, you must bid higher than the current highest bid.')
      throw new BadRequestException('Your bid must be higher than the current highest bid.');
    }
    else {
      try {
        await this.prisma.bid.updateMany({
          where: {
            auction_id,
          },
          data: {
            status: "Outbid"
          }
        });
        const bid = await this.prisma.bid.create({
          data: {
            amount: +createBidDto.amount,
            user_id: user.user_id,
            auction_id: auction_id,
          },
        });
        return bid
      } catch (error) {
        Logging.error(error)
        throw new BadRequestException('Something went wrong while creating your bid.');
      }
    }
  }

  async findCurrentBidsOfUser(user_id: number) {
    return this.prisma.bid.findMany({
      where: {
        user_id,
        Auction: {
          endedAt: {
            gt: new Date()
          }
        }
      },
      include: {
        Auction: true,
      },
    });
  }
  
  async findWonBidsOfUser(user_id: number) {
    return this.prisma.bid.findMany({
      where: {
        user_id,
        status: "Winning",
        Auction: {
          endedAt: {
            lt: new Date()
          }
        }
      },
      include: {
        Auction: true,
      },
    });
  }
    
  async findBidsOfAuction(auction_id: number) {
    return this.prisma.bid.findMany({
      where: {
        auction_id,
      },
      include: {
        Auction: true,
        User: {
          select: {
            user_id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
          amount: 'desc'
      }
    });
  }
}
