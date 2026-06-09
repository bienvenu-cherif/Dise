import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AnneeAcademique } from '../annees-academiques/annee-academique.entity';
import { AcademicLevel } from '../levels/academic-level.entity';
import { User } from '../users/user.entity';

export type StatutScolaire = 'actif' | 'redoublant' | 'abandon' | 'exclu' | 'alumni';

@Entity('inscriptions_annuelles')
@Index(['user', 'anneeAcademique'], { unique: true })
export class InscriptionAnnuelle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => AnneeAcademique, (annee) => annee.inscriptions, { eager: true })
  anneeAcademique: AnneeAcademique;

  @ManyToOne(() => AcademicLevel, { eager: true })
  level: AcademicLevel;

  @Column({ length: 30, default: 'actif' })
  statutScolaire: StatutScolaire;

  @Column({ default: true })
  eligibleCotisation: boolean;

  @Column({ type: 'text', nullable: true })
  commentaire?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
