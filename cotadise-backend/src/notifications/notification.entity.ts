import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AnneeAcademique } from '../annees-academiques/annee-academique.entity';
import { User } from '../users/user.entity';

export type TypeNotification =
  | 'rappel_cotisation'
  | 'paiement_confirme'
  | 'message_manuel'
  | 'demande_aide_alumni'
  | 'defi_recu'
  | 'defi_termine'
  | 'paiement_pour_toi';

export type CanalNotification = 'application' | 'email' | 'application_et_email';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  recipient?: User;

  @ManyToOne(() => User, { eager: true, nullable: true })
  sender?: User;

  @ManyToOne(() => AnneeAcademique, { eager: true, nullable: true })
  anneeAcademique?: AnneeAcademique;

  @Column({ length: 50 })
  type: TypeNotification;

  @Column({ length: 30, default: 'application' })
  canal: CanalNotification;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ length: 50, nullable: true })
  promotionSortante?: string;

  @Column({ default: false })
  read: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;

  @Column({ default: false })
  emailSent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  emailSentAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
