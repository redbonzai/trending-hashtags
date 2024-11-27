import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  UpdateDateColumn,
} from 'typeorm';
import { Tweet } from './tweet.entity';

@Entity('hashtags')
export class Hashtag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  tag: string;

  @Column({ default: 0 })
  count: number;

  @UpdateDateColumn() // Automatically updates on each save
  updatedAt: Date;

  @ManyToMany(() => Tweet, (tweet) => tweet.hashtags)
  tweets: Tweet[];
}
