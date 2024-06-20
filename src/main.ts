import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import Logging from './library/Logging';
import cookieParser  from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(), {
    bufferLogs: true,
  })
  app.enableCors({
    origin: ['http://localhost:3000'],
    //origin: ['https://auctionbay-frontend.onrender.com'],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe())
  app.use(cookieParser())
  const PORT = process.env.PORT || 8080
  await app.listen(PORT)
  
  Logging.log(`App is listening on: ${await app.getUrl()}`)
}
bootstrap();
