import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { BidsService } from './bids.service';
import { Prisma, User } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { GetCurrentUser } from 'src/decorators/get-current-user.decorator';
import { AuctionsService } from '../auctions/auctions.service';
import { JwtAuthGuard } from '../auth/guards';

@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService,
              private readonly auctionsService: AuctionsService,
              private readonly prisma: DatabaseService
              ) {}


  @UseGuards(JwtAuthGuard)
  @Post('auctions/:id/bid')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createBidDto: Prisma.BidCreateInput,@GetCurrentUser() user: User, @Param('id') auction_id: number) {
    if(await this.auctionsService.isUserOwner(user.user_id, +auction_id)){
      throw new ForbiddenException("You can't bid on your own auction.")
    }
    else{
      return this.bidsService.create(createBidDto, user, +auction_id);
    }
  }

  @Get('user/:id')
  async findCurrentBidsOfUser(@Param('id') id: number) {
    return this.bidsService.findCurrentBidsOfUser(+id);
  }
  
  @Get('user/won/:id')
  async findWonBidsOfUser(@Param('id') id: number) {
    return this.bidsService.findWonBidsOfUser(+id);
  }
    
  @Get('auction/:id')
  async findBidsOfAuction(@Param('id') id: number) {
    return this.bidsService.findBidsOfAuction(+id);
  }
}
