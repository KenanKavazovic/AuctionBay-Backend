import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Auction, Prisma, User } from '@prisma/client';
import { DatabaseService } from 'src/modules/database/database.service';
import { join } from 'path';
import Logging from 'src/library/Logging';
import * as fs from 'fs';

@Injectable()
export class AuctionsService {
constructor (private readonly prisma: DatabaseService) {}

async create(createAuctionDto: Prisma.AuctionCreateInput, user: User): Promise<Auction> {
  try {
    const endedAt = new Date(createAuctionDto.endedAt)
    if (isNaN(endedAt.getTime())) {
      throw new BadRequestException('Invalid date format for endedAt');
    }
    const auction = await this.prisma.auction.create({
      data: {
        title: createAuctionDto.title,
        description: createAuctionDto.description,
        startingPrice: +createAuctionDto.startingPrice,
        endedAt: endedAt.toISOString(),
        image: createAuctionDto.image,
        user_id: user.user_id
      },
    });
    return auction;
  } catch (error) {
    Logging.error(error);
    throw new BadRequestException('Something went wrong while creating a new auction.');
  }
}

  async update(auction_id: number, updateAuctionDto: Prisma.AuctionUpdateInput) {
    try {
      return this.prisma.auction.update({
        where: {
          auction_id,
        },
        data: {
          title: updateAuctionDto.title,
          description: updateAuctionDto.description,
          endedAt: updateAuctionDto.endedAt,
          startingPrice: updateAuctionDto.startingPrice,
          image: updateAuctionDto.image
        }
      });
    } catch (error) {
      Logging.error(error)
      throw new InternalServerErrorException('Something went wrong while editing your auction.')
    }
  }

  async isUserOwner(userId: number, auction_id: number): Promise<boolean> {
    const auction = await this.prisma.auction.findUnique({
      where: { auction_id },
      select: { user_id: true },
    });
    return auction?.user_id === userId;
  }

  async remove(auction_id: number) {
    return this.prisma.auction.delete({
      where: { auction_id },
    });
  }
      
  async findAuction(auction_id: number) {
    return this.prisma.auction.findUnique({
      where: {
        auction_id,
      },
      include: {
        bids: true,
      },
    });
  }

  async findAllAuctionsOfUser(user_id: number) {
    const ongoingAuctions = await this.prisma.auction.findMany({
        where: {
            user_id: user_id,
            endedAt: {
                gt: new Date()
            }
        },
        orderBy: {
            endedAt: 'asc'
        }
    });

    const finishedAuctions = await this.prisma.auction.findMany({
        where: {
            user_id: user_id,
            endedAt: {
                lte: new Date()
            }
        },
        orderBy: {
            endedAt: 'asc'
        }
    });

    const allAuctions = [...ongoingAuctions, ...finishedAuctions];
    return allAuctions;
}


  async uploadImage(auction_id: number, file: Express.Multer.File): Promise<string> {
    const fileSizeLimit = 5 * 1024 * 1024;
    if (file.size > fileSizeLimit) {
      throw new Error('File size exceeds the limit.');
    }
    const allowedFileTypes = ['.png', '.jpg', '.jpeg'];
    const fileExtension = file.originalname.split('.').pop();
    if (!allowedFileTypes.includes(`.${fileExtension}`)) {
      throw new Error('Invalid file type. Only PNG, JPG, and JPEG files are allowed.');
    }
    const uploadDir = join(process.cwd(), 'files', 'images');
    const imageFileName = `${auction_id}-${file.originalname}`;
    const imageFilePath = join(uploadDir, imageFileName);
    
    const auction = await this.prisma.auction.findUnique({ where: { auction_id }});
    if (auction.image) {
      await fs.promises.unlink(imageFilePath).catch((error) => {
        console.error('Error deleting file:', auction.image, error);
      });
    }
    await fs.promises.mkdir(uploadDir, { recursive: true });
    await fs.promises.writeFile(imageFilePath, file.buffer);
    return imageFileName;
  }

  async updateImage(auction_id: number, imageFileName: string): Promise<Auction> {
    return this.prisma.auction.update({
    where : { auction_id },
    data: { image: imageFileName }
    });
  }

  async getImage(auction_id: number): Promise<string | undefined> {
    const auction = await this.prisma.auction.findUnique({ where: { auction_id }});
    if (auction && auction.image) {
      const imagePath = join(process.cwd(), 'files', 'images', auction.image);
      return imagePath;
    }
    return undefined;
  }
}
