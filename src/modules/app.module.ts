import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuctionsModule } from 'src/modules/auctions/auctions.module';
import { UsersModule } from 'src/modules/users/users.module';
import { AuthModule } from './auth/auth.module';
import { LoggerMiddleware } from 'src/middleware/logger.middleware';
import { ConfigModule } from '@nestjs/config';
import { configValidationSchema } from 'src/config/schema.config';
import { BidsModule } from './bids/bids.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env`],
      validationSchema: configValidationSchema,
    }),
    DatabaseModule, 
    AuctionsModule,
    BidsModule,
    UsersModule, 
    AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL })
  }
}
