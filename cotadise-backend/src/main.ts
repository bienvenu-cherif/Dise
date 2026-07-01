import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const configuredOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const localTestOrigins = [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/];
  app.enableCors({
    origin: configuredOrigins.length
      ? (origin, callback) => {
          if (!origin || configuredOrigins.includes(origin) || localTestOrigins.some((pattern) => pattern.test(origin))) {
            callback(null, true);
            return;
          }
          callback(new Error(`Origine CORS non autorisee: ${origin}`));
        }
      : true,
    credentials: false,
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
