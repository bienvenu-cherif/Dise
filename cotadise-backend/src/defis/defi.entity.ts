import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AnneeAcademique } from '../annees-academiques/annee-academique.entity';
import { User } from '../users/user.entity';

export type StatutDefi = 'en_attente' | 'accepte' | 'refuse' | 'annule' | 'termine';

@Entity('defis')
export class Defi {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  challenger: User;

  @ManyToOne(() => User, { eager: true })
  opponent: User;

  @ManyToOne(() => AnneeAcademique, { eager: true })
  anneeAcademique: AnneeAcademique;

  @Column({ length: 20, default: 'en_attente' })
  status: StatutDefi;

  @ManyToOne(() => User, { eager: true, nullable: true })
  winner?: User;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  refusedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
