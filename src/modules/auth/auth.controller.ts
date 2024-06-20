import { Body, ClassSerializerInterceptor, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto.';
import { User } from '@prisma/client';
import { Public } from 'src/decorators/public.decorator';
import { Response, Request } from 'express'
import { RequestWithUser } from '../../interfaces/auth.interface'
import { GetCurrentUser } from 'src/decorators/get-current-user.decorator';
import { JwtAuthGuard, JwtRefreshAuthGuard, LocalAuthGuard, NotAuthGuard } from './guards';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(NotAuthGuard)
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() body: RegisterUserDto): Promise<User> {
    return this.authService.signup(body)
  }

  @Public()
  @UseGuards(LocalAuthGuard, NotAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: RequestWithUser, @Res() res: Response): Promise<void> {
    return this.authService.login(req.user, res)
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')    
  @HttpCode(HttpStatus.OK)
  async logout(@GetCurrentUser() user: User, @Res() res: Response): Promise<void> {
    return this.authService.logout(user.user_id, res)
  }

  @Public()
  @UseGuards(JwtRefreshAuthGuard)
  @Get('refresh')
  @HttpCode(HttpStatus.ACCEPTED)
  async refreshTokens(@Req() req: Request): Promise<User> {
    return this.authService.refreshTokens(req)
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@GetCurrentUser() user: User): Promise<User> {
    return user
  }
}