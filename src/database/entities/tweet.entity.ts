import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Hashtag } from './hashtag.entity';

@Entity('tweets')
export class Tweet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToMany(() => Hashtag, (hashtag) => hashtag.tweets, { cascade: true })
  @JoinTable() // This creates the join table for the many-to-many relationship
  hashtags: Hashtag[];
}
