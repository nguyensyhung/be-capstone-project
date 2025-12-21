import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Person } from '../person/person.entity';
import { Connection } from '../connection/connection.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Person, Connection])],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
