import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Column,
} from 'typeorm';
import { Person } from '../person/person.entity';

@Entity('connections')
export class Connection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'from_person_id' })
  fromPersonId: number;

  @Column({ name: 'to_person_id' })
  toPersonId: number;

  @ManyToOne(() => Person, (person) => person.outgoingConnections)
  @JoinColumn({ name: 'from_person_id' })
  fromPerson: Person;

  @ManyToOne(() => Person, (person) => person.incomingConnections)
  @JoinColumn({ name: 'to_person_id' })
  toPerson: Person;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
