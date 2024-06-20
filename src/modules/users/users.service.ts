import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { User } from '@prisma/client';
import { RegisterUserDto } from 'src/modules/auth/dto/register-user.dto.';
import { DatabaseService } from 'src/modules/database/database.service';
import { omit } from 'lodash';
import { compareHash, hash } from 'src/utils/bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { PostgresErrorCode } from 'src/helpers/postgresErrorCodes.enum';
import { join } from 'path';
import Logging from 'src/library/Logging';
import * as fs from 'fs';

@Injectable()
export class UsersService {
  constructor (private readonly prisma: DatabaseService) {}

  async create(registerUserDto: RegisterUserDto, hashedPassword: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email: registerUserDto.email }});
    if (user) {
      throw new BadRequestException('User with that email already exists.')
    }
    try {
      const user = await this.prisma.user.create({
        data: {
          ...omit(registerUserDto, ['confirm_password']),
          password: hashedPassword,
          },
      });
      return user;
    } catch (error) {
      Logging.error(error)
      throw new BadRequestException('Something went wrong while creating a new user.')
    }
  }

  async update(user_id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { user_id }});
    const { email, current_password, password, confirm_password } = updateUserDto
    if (user.email !== email && email) {
      user.email = email
    }
    if (password && confirm_password) {
      if (password !== confirm_password) {
        throw new BadRequestException('Passwords do not match.')
      }
      else if (!(await compareHash(current_password, user.password))) {
        throw new BadRequestException('The password you entered is incorrect.')
      }
      else if (await compareHash(password, user.password)) {
        throw new BadRequestException('New password cannot be the same as your old password.')
      }
      else {
        user.password = await hash(password)
      }
    }
    try {
      const updatedUser = await this.prisma.user.update({
        where: { user_id },
        data: { ...omit(updateUserDto, ['confirm_password', 'current_password']), 
        password: user.password },
      });
      return updatedUser;
    } catch (error) {
      Logging.error(error)
      if (error?.code === PostgresErrorCode.UniqueViolation) {
        throw new BadRequestException('User with that email already exists')
      }
      throw new InternalServerErrorException('Something went wrong while updating user data.')
    }
  }
  
  async uploadAvatar(user_id: number, file: Express.Multer.File): Promise<string> {
    const fileSizeLimit = 5 * 1024 * 1024;
    if (file.size > fileSizeLimit) {
      throw new Error('File size exceeds the limit.');
    }
    const allowedFileTypes = ['.png', '.jpg', '.jpeg'];
    const fileExtension = file.originalname.split('.').pop();
    if (!allowedFileTypes.includes(`.${fileExtension}`)) {
      throw new Error('Invalid file type. Only PNG, JPG, and JPEG files are allowed.');
    }
    const uploadDir = join(process.cwd(), 'files', 'avatars');
    const avatarFileName = `${user_id}-${file.originalname}`;
    const avatarFilePath = join(uploadDir, avatarFileName);
    
    const user = await this.prisma.user.findUnique({ where: { user_id }});
    if (user.avatar) {
      await fs.promises.unlink(avatarFilePath).catch((error) => {
        console.error('Error deleting file:', user.avatar, error);
      });
    }
    await fs.promises.mkdir(uploadDir, { recursive: true });
    await fs.promises.writeFile(avatarFilePath, file.buffer);
    return avatarFileName;
  }
  
  async updateAvatar(user_id: number, avatarFileName: string): Promise<User> {
    return this.prisma.user.update({
    where : { user_id },
    data: { avatar: avatarFileName }
    });
  }
  
  async getAvatar(user_id: number): Promise<string | undefined> {
    const user = await this.prisma.user.findUnique({ where: { user_id }});
    if (user && user.avatar) {
      const avatarPath = join(process.cwd(), 'files', 'avatars', user.avatar);
      return avatarPath;
    }
    return undefined;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async findById(user_id: number) {
    return this.prisma.user.findUnique({
      where: {
        user_id,
      },
    });
  }
}