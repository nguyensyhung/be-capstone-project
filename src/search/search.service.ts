import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from '../person/person.entity';
import { Connection } from '../connection/connection.entity';

export interface SearchResult {
  path: Person[];
  pathLength: number;
  nodesExplored: number;
  searchTimeMs: number;
  found: boolean;
}

export interface PathStep {
  personId: number;
  personName: string;
  level: number;
}

@Injectable()
export class SearchService {
  // In-memory cache for graph data
  private graphCache: Map<number, number[]> | null = null;
  private personCache: Map<number, Person> | null = null;

  constructor(
    @InjectRepository(Person)
    private personRepository: Repository<Person>,
    @InjectRepository(Connection)
    private connectionRepository: Repository<Connection>,
  ) {
    // Initialize cache on startup
    this.initializeCache();
  }

  /**
   * Initialize in-memory graph cache for fast BFS
   */
  async initializeCache(): Promise<void> {
    try {
      console.log('🔄 Initializing graph cache...');

      // Load all persons
      const persons = await this.personRepository.find();
      this.personCache = new Map(persons.map((p) => [p.id, p]));

      // Load all connections and build adjacency list
      const connections = await this.connectionRepository.find();
      this.graphCache = new Map();

      // Initialize adjacency list
      persons.forEach((person) => {
        this.graphCache.set(person.id, []);
      });

      // Build adjacency list (directed graph)
      connections.forEach((conn) => {
        const neighbors = this.graphCache.get(conn.fromPersonId) || [];
        neighbors.push(conn.toPersonId);
        this.graphCache.set(conn.fromPersonId, neighbors);
      });

      console.log(
        `✅ Graph cache initialized: ${persons.length} persons, ${connections.length} connections`,
      );
    } catch (error) {
      console.error('❌ Failed to initialize cache:', error);
    }
  }

  /**
   * Find all persons
   */
  async getAllPersons(): Promise<Person[]> {
    return this.personRepository.find({
      order: { name: 'ASC' },
    });
  }

  /**
   * Find person by name
   */
  async findPersonByName(name: string): Promise<Person> {
    const person = await this.personRepository.findOne({ where: { name } });
    if (!person) {
      throw new NotFoundException(`Person "${name}" not found`);
    }
    return person;
  }

  /**
   * BFS Algorithm to find shortest path between two persons
   */
  async findShortestPath(
    startName: string,
    endName: string,
  ): Promise<SearchResult> {
    const startTime = Date.now();

    // Find start and end persons
    const startPerson = await this.findPersonByName(startName);
    const endPerson = await this.findPersonByName(endName);

    // Same person check
    if (startPerson.id === endPerson.id) {
      return {
        path: [startPerson],
        pathLength: 0,
        nodesExplored: 1,
        searchTimeMs: Date.now() - startTime,
        found: true,
      };
    }

    // Ensure cache is loaded
    if (!this.graphCache || !this.personCache) {
      await this.initializeCache();
    }

    // BFS Implementation
    const queue: PathStep[] = [
      {
        personId: startPerson.id,
        personName: startPerson.name,
        level: 0,
      },
    ];

    const visited = new Set<number>([startPerson.id]);
    const parent = new Map<number, number>(); // To reconstruct path
    let nodesExplored = 0;
    let found = false;

    // BFS Loop
    while (queue.length > 0) {
      const current = queue.shift()!;
      nodesExplored++;

      // Check if we reached the target
      if (current.personId === endPerson.id) {
        found = true;
        break;
      }

      // Get neighbors from cache
      const neighbors = this.graphCache.get(current.personId) || [];

      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          parent.set(neighborId, current.personId);

          const neighborPerson = this.personCache.get(neighborId);
          if (neighborPerson) {
            queue.push({
              personId: neighborId,
              personName: neighborPerson.name,
              level: current.level + 1,
            });
          }
        }
      }
    }

    // Reconstruct path if found
    let path: Person[] = [];
    if (found) {
      path = this.reconstructPath(parent, startPerson.id, endPerson.id);
    }

    const searchTimeMs = Date.now() - startTime;

    return {
      path,
      pathLength: path.length - 1, // Number of edges
      nodesExplored,
      searchTimeMs,
      found,
    };
  }

  /**
   * Reconstruct path from parent map
   */
  private reconstructPath(
    parent: Map<number, number>,
    startId: number,
    endId: number,
  ): Person[] {
    const path: number[] = [];
    let current = endId;

    // Backtrack from end to start
    while (current !== startId) {
      path.unshift(current);
      current = parent.get(current)!;
    }
    path.unshift(startId);

    // Convert IDs to Person objects
    return path.map((id) => this.personCache.get(id)!).filter((p) => p);
  }

  /**
   * Get graph data for visualization
   */
  async getGraphData() {
    // Ensure cache is loaded
    if (!this.graphCache || !this.personCache) {
      await this.initializeCache();
    }

    // Build nodes array
    const nodes = Array.from(this.personCache.values()).map((person) => ({
      id: person.id.toString(),
      label: person.name,
      category: person.category,
    }));

    // Build edges array from adjacency list
    const edges: Array<{ source: string; target: string }> = [];
    this.graphCache.forEach((neighbors, sourceId) => {
      neighbors.forEach((targetId) => {
        edges.push({
          source: sourceId.toString(),
          target: targetId.toString(),
        });
      });
    });

    return {
      nodes,
      edges,
    };
  }

  /**
   * Get statistics about the graph
   */
  async getGraphStats() {
    const personCount = await this.personRepository.count();
    const connectionCount = await this.connectionRepository.count();

    // Calculate average connections per person
    const avgConnections =
      personCount > 0 ? (connectionCount / personCount).toFixed(2) : 0;

    return {
      totalPersons: personCount,
      totalConnections: connectionCount,
      averageConnectionsPerPerson: avgConnections,
      cacheLoaded: this.graphCache !== null,
    };
  }
}
