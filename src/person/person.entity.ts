import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Connection } from '../connection/connection.entity';

@Entity('persons')
export class Person {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 255 })
  name: string;

  @Column({ name: 'wikipedia_url', length: 500 })
  wikipediaUrl: string;

  @Column({ nullable: true, length: 100 })
  category: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Connection, (connection) => connection.fromPerson)
  outgoingConnections: Connection[];

  @OneToMany(() => Connection, (connection) => connection.toPerson)
  incomingConnections: Connection[];
}
