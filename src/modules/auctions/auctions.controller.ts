import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus, ForbiddenException, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { Auction, Prisma, User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards';
import { GetCurrentUser } from 'src/decorators/get-current-user.decorator';
import { DatabaseService } from '../database/database.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from "express";

@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService,
              private readonly prisma: DatabaseService
              ) {}

  @UseGuards(JwtAuthGuard)
  @Post('me/auction')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAuctionDto: Prisma.AuctionCreateInput, @GetCurrentUser() user: User): Promise<{ id: number }> {
    const createdAuction = await this.auctionsService.create(createAuctionDto, user)
    return { id: createdAuction.auction_id };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/auction/:id')
  @HttpCode(HttpStatus.OK)
  async update(@GetCurrentUser() user: User, @Param('id') id: number, @Body() updateAuctionDto: Prisma.AuctionUpdateInput): Promise<Auction> {
    if(await this.auctionsService.isUserOwner(user.user_id, +id)){
    return this.auctionsService.update(+id, updateAuctionDto)
    } else {
      throw new ForbiddenException("You can only edit your own auctions.")
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@GetCurrentUser() user: User, @Param('id') id: number): Promise<Auction> {
    if(await this.auctionsService.isUserOwner(user.user_id, +id)){
      return this.auctionsService.remove(+id)
    } else {
      throw new ForbiddenException("You can only delete your own auctions.")
    }
  }
  
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() { 
    return this.prisma.auction.findMany({ where: {endedAt: {gt: new Date()} }, orderBy: { endedAt: 'asc'} });
  }

  @Get('user/:id')
  async findAllAuctionsOfUser(@Param('id') id: number) {
    return this.auctionsService.findAllAuctionsOfUser(+id);
  }
      
  @Get('auction/:id')
  async findBidsOfAuction(@Param('id') id: number) {
    return this.auctionsService.findAuction(+id);
  }

  @Post('uploadImage/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Param('id') auction_id: number): Promise<Auction> {
    const imageFileName = await this.auctionsService.uploadImage(+auction_id, file);
    return this.auctionsService.updateImage(+auction_id, imageFileName);
  }
    
  @Get('image/:id')
  async getImage(@Param('id') auction_id: number, @Res() res: Response) {
    const imagePath = await this.auctionsService.getImage(+auction_id);
    if (!imagePath) {
      return res.status(404).send();
    }
    return res.sendFile(imagePath);
  }
}
