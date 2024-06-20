import { MiddlewareConsumer, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtService } from '@nestjs/jwt';
import { CurrentUserMiddleware } from 'src/middleware/current-user.middleware';

@Module({
  controllers: [UsersController],
  providers: [UsersService, JwtService],
  exports: [UsersService]
})
export class UsersModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CurrentUserMiddleware).forRoutes('*');
  }
}
