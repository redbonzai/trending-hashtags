import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Joi from 'joi';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hashtag } from './entities/hashtag.entity';
import { Tweet } from './entities/tweet.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // this is a bogus update
      validationSchema: Joi.object({
        REDIS_URL: Joi.string().required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: parseInt(configService.get('DB_PORT')),
        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
        database: configService.get('POSTGRES_DB'),
        entities: [Hashtag, Tweet],
        synchronize: true,
      }),
    }),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class DatabaseModule {
  constructor(private readonly configService: ConfigService) {
    console.log('DatabaseModule has been initialized');
    console.log('DB_HOST:', this.configService.get('DB_HOST'));
    console.log('DB_PORT:', this.configService.get('DB_PORT'));
    console.log('POSTGRES_USER:', this.configService.get('POSTGRES_USER'));
    console.log('DB PASS:', this.configService.get('POSTGRES_PASSWORD'));
    console.log('POSTGRES_DB:', this.configService.get('POSTGRES_DB'));
  }
}
