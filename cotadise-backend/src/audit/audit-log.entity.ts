import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 80 })
  action: string;

  @Column({ length: 80 })
  entityType: string;

  @Column({ length: 120, nullable: true })
  entityId?: string;

  @Column({ length: 40, default: 'application' })
  actorType: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  actor?: User;

  @Column({ type: 'jsonb', nullable: true })
  details?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
