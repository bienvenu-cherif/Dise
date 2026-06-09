import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AnneeAcademique } from '../annees-academiques/annee-academique.entity';
import { AcademicLevel } from '../levels/academic-level.entity';
import { User } from '../users/user.entity';

export type TypeMontantCotisation = 'niveau' | 'exception';

@Entity('montants_cotisation')
export class MontantCotisation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AnneeAcademique, (annee) => annee.montantsCotisation, { eager: true })
  anneeAcademique: AnneeAcademique;

  @ManyToOne(() => AcademicLevel, { eager: true, nullable: true })
  level?: AcademicLevel;

  @ManyToOne(() => User, { eager: true, nullable: true })
  user?: User;

  @Column({ length: 20, default: 'niveau' })
  type: TypeMontantCotisation;

  @Column({ type: 'float' })
  montant: number;

  @Column({ type: 'date', name: 'date_limite' })
  dateLimite: string;

  @Column({ type: 'text', nullable: true })
  commentaire?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
