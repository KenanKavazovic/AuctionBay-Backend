import {
    BadRequestException,
    ForbiddenException,
    Inject,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
    forwardRef,
  } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { User } from '@prisma/client';
import { compareHash, hash } from 'src/utils/bcrypt';
import { RegisterUserDto } from './dto/register-user.dto.';
import { UsersService } from 'src/modules/users/users.service';
import { CookieType, JwtType, TokenPayload } from 'src/interfaces/auth.interface';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PostgresErrorCode } from 'src/helpers/postgresErrorCodes.enum';
import { Response, Request } from 'express'
import Logging from 'src/library/Logging';
import * as bcrypt from 'bcrypt';

  @Injectable()
  export class AuthService {
    constructor(private prisma: DatabaseService,
        @Inject(forwardRef(() => UsersService)) private usersService: UsersService,      
        private jwtService: JwtService,
        private configService: ConfigService
        ) {}
  
      async signup(registerUserDto: RegisterUserDto): Promise<User> {
        const existingUser = await this.prisma.user.findUnique({
          where: { email: registerUserDto.email },
        });
        if (existingUser) {
          throw new BadRequestException('User with this email already exists');
        } else {
        const hashedPassword: string = await hash(registerUserDto.password);
        const user = await this.usersService.create(
          registerUserDto,
          hashedPassword,
        );
        const refreshToken = await this.generateToken(user.user_id, user.email, JwtType.REFRESH_TOKEN);
        await this.updateRtHash(user.user_id, refreshToken);
        return user;
        }
      }
      
      async login(userFromRequest: User, res: Response): Promise<void> {
        const user = await this.usersService.findById(userFromRequest.user_id);
        const accessToken = await this.generateToken(user.user_id, user.email, JwtType.ACCESS_TOKEN);
        const accessTokenCookie = await this.generateCookie(accessToken, CookieType.ACCESS_TOKEN);
        const refreshToken = await this.generateToken(user.user_id, user.email, JwtType.REFRESH_TOKEN)
        const refreshTokenCookie = await this.generateCookie(user.refreshToken, CookieType.REFRESH_TOKEN);
        try {
          await this.updateRtHash(user.user_id, refreshToken)
          res.setHeader('Set-Cookie', [accessTokenCookie, refreshTokenCookie]).json({ ...user });
        } catch (error) {
          Logging.error(error);
          throw new InternalServerErrorException('Something went wrong while setting cookies into response header.');
        }
      }
      
      async logout(user_id: number, res: Response): Promise<void> {
        const user = await this.usersService.findById(user_id)
        await this.usersService.update(user.user_id, { refreshToken: null })
        try {
          res.setHeader('Set-Cookie', this.getCookiesForSignOut()).sendStatus(200)
        } catch (error) {
          Logging.error(error)
          throw new InternalServerErrorException('Something went wrong while setting cookies into response header.')
        }
      }

      async generateToken(user_id: number, email: string, type: JwtType): Promise<string> {
        try {
          const payload: TokenPayload = { sub: user_id, name: email, type };
          let token: string;
          switch (type) {
            case JwtType.REFRESH_TOKEN:
              token = await this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get('JWT_REFRESH_SECRET_EXPIRES'),
              });
              break;
            case JwtType.ACCESS_TOKEN:
              token = await this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: this.configService.get('JWT_SECRET_EXPIRES'),
              });
              break;
            default:
              throw new BadRequestException('Permission denied.');
          }
          return token;
        } catch (error) {
          Logging.error(error);
          if (error?.code === PostgresErrorCode.UniqueViolation) {
            throw new BadRequestException('User with that email already exists.');
          }
          throw new InternalServerErrorException('Something went wrong while generating a new token.');
        }
      }
      
      async generateCookie(token: string, type: CookieType): Promise<string> {
        try {
          let cookie: string
          switch (type) {
            case CookieType.REFRESH_TOKEN:
              cookie = `refresh_token=${token}; HttpOnly; Path=/; SameSite=None; Secure`
              break
            case CookieType.ACCESS_TOKEN:
              cookie = `access_token=${token}; HttpOnly; Path=/; SameSite=None; Secure`
              break
            default:
              throw new BadRequestException('Permission denied.')
          }
          return cookie
        } catch (error) {
          Logging.error(error)
          throw new InternalServerErrorException('Something went wrong while generating a new cookie.')
        }
      }
    
      getCookiesForSignOut(): string[] {
        return ['access_token=; HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure', 'refresh_token=; HttpOnly; Path=/; Max-Age=0;']
      }
  
      async refreshTokens(req: Request): Promise<User> {
        const user = await this.prisma.user.findFirst({where: {refreshToken: req.cookies.refreshToken}});
        if (!user) {
          throw new ForbiddenException();
        }
        try {
          await this.jwtService.verifyAsync(user.refreshToken, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
          });
        } catch (error) {
          Logging.error(error);
          throw new UnauthorizedException('Something went wrong while refreshing tokens.');
        }
        const newRefreshToken = await this.generateToken(user.user_id, user.email, JwtType.REFRESH_TOKEN);
        await this.updateRtHash(user.user_id, newRefreshToken);
        const token = await this.generateToken(user.user_id, user.email, JwtType.ACCESS_TOKEN);
        const cookie = await this.generateCookie(token, CookieType.ACCESS_TOKEN);
        try {
          req.res.setHeader('Set-Cookie', cookie);
        } catch (error) {
          Logging.error(error);
          throw new InternalServerErrorException('Something went wrong while setting cookies into the response header.');
        }
        return user;
      }  

      async updateRtHash(user_id: number, rt: string): Promise<void> {
        try {
          const hashedToken = await bcrypt.hash(rt, 10);
          await this.prisma.user.update({
            where: { user_id },
            data: { refreshToken: hashedToken },
          });
        } catch (error) {
          Logging.error(error);
          throw new InternalServerErrorException('Something went wrong while updating the refresh token.');
        }
      }
      
      async validateUser(email: string, password: string): Promise<User> {
        Logging.log('Validating user...');
        const user = await this.usersService.findByEmail( email );
        if (!user) {
          throw new BadRequestException('Invalid credentials.');
        }
        if (!(await compareHash(password, user.password))) {
          throw new BadRequestException('Invalid credentials.');
        }
        Logging.log('User is valid.');
        const refreshToken = await this.generateToken(user.user_id, user.email, JwtType.REFRESH_TOKEN);
        await this.updateRtHash(user.user_id, refreshToken);
        return user;
      }

      async getUserIfRefreshTokenMatches(refreshToken: string, user_id: number): Promise<User> {
        const user = await this.usersService.findById(user_id)
        const isRefreshTokenMatching = await compareHash(refreshToken, user.refreshToken)
        if (isRefreshTokenMatching) {
          return user
        }
      }
  }