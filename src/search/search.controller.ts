import {
  Controller,
  Post,
  Get,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SearchService, SearchResult } from './search.service';
import { IsString, IsNotEmpty } from 'class-validator';

export class SearchDto {
  @IsString()
  @IsNotEmpty()
  startPerson: string;

  @IsString()
  @IsNotEmpty()
  endPerson: string;
}

@Controller('api/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * POST /api/search
   * Find shortest path between two persons
   */
  @Post()
  async search(@Body() searchDto: SearchDto): Promise<SearchResult> {
    try {
      const result = await this.searchService.findShortestPath(
        searchDto.startPerson,
        searchDto.endPerson,
      );

      if (!result.found) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: `No path found between "${searchDto.startPerson}" and "${searchDto.endPerson}"`,
            result,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Search failed',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/search/persons
   * Get all available persons for search
   */
  @Get('persons')
  async getAllPersons() {
    try {
      const persons = await this.searchService.getAllPersons();
      return {
        count: persons.length,
        persons: persons.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          wikipediaUrl: p.wikipediaUrl,
        })),
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch persons',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/search/graph
   * Get graph data for visualization
   */
  @Get('graph')
  async getGraphData() {
    try {
      return await this.searchService.getGraphData();
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch graph data',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/search/stats
   * Get graph statistics
   */
  @Get('stats')
  async getStats() {
    try {
      return await this.searchService.getGraphStats();
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch stats',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
