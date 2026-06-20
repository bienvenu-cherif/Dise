import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Notification } from '../notifications/notification.entity';
import { User } from '../users/user.entity';

export type StatutEmailMessage = 'en_attente' | 'envoye' | 'echec';

@Entity('email_messages')
export class EmailMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Notification, { eager: true, nullable: true, onDelete: 'SET NULL' })
  notification?: Notification;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  recipient?: User;

  @Column({ length: 150 })
  recipientEmail: string;

  @Column({ length: 150, nullable: true })
  recipientName?: string;

  @Column({ length: 150 })
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ length: 20, default: 'en_attente' })
  status: StatutEmailMessage;

  @Column({ default: 0 })
  attempts: number;

  @Column({ type: 'text', nullable: true })
  lastError?: string;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
