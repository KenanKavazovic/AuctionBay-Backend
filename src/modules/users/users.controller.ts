import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { Patch, Res, UploadedFile, UseGuards } from '@nestjs/common/decorators/index'
import { UsersService } from './users.service';
import { User } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetCurrentUser } from 'src/decorators/get-current-user.decorator';
import { Response } from "express";

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('update/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') user_id: number, @Body() updateUserDto: UpdateUserDto): Promise<User> {
    return this.usersService.update(+user_id, updateUserDto)
  }

  @Post('uploadAvatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @GetCurrentUser() user: User,): Promise<User> {
    const avatarFileName = await this.usersService.uploadAvatar(user.user_id, file);
    return this.usersService.updateAvatar(user.user_id, avatarFileName);
  }
    
  @Get('avatar/:id')
  async getAvatar(@Param('id') id: number, @Res() res: Response) {
    const avatarPath = await this.usersService.getAvatar(+id);
    if (!avatarPath) {
      return res.status(404).send();
    }
    return res.sendFile(avatarPath);
  }
}
