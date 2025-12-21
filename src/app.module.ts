import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PersonController } from './person/person.controller';
import { ConnectionController } from './connection/connection.controller';
import { SearchController } from './search/search.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Person } from './person/person.entity';
import { Connection } from './connection/connection.entity';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'sixth_degree',
      entities: [Person, Connection],
      synchronize: true,
      logging: process.env.NODE_ENV !== 'production',
      charset: 'utf8mb4',
    }),
    SearchModule,
  ],
  controllers: [
    AppController,
    PersonController,
    ConnectionController,
    SearchController,
  ],
  providers: [AppService],
})
export class AppModule {}
