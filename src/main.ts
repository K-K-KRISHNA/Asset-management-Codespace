import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const apiPrefix = configService.get<string>('API_PREFIX')!;
  const port = configService.get<number>('PORT')

  app.setGlobalPrefix(apiPrefix)

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v'
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  )
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalInterceptors(new ResponseInterceptor())

  const swaggerConfig = new DocumentBuilder()
  .setTitle('Application API')
  .setDescription('API documentation')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

SwaggerModule.setup('api/docs', app, swaggerDocument);

  await app.listen(port ?? 3000);
}
bootstrap();
