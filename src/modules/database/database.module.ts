import { Global, Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';

@Global()
@Module({
  imports: [ConfigModule.forRoot()], 
  providers: [DatabaseService,
    {
      provide: PrismaClient,
      useFactory: (configService: ConfigService) => {
        const prisma = new PrismaClient({
          datasources: {
            db: {
              url: configService.get<string>('DATABASE_URL'),
            },
          },
        });
        return prisma;
      },
      inject: [ConfigService],
    },
  ],
  exports: [PrismaClient, DatabaseService],
})
export class DatabaseModule {}
