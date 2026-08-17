import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:true,
      cache: true,
      validationSchema: envValidationSchema,
      
    }),
    HealthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
