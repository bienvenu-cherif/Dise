import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { InscriptionAnnuelle } from '../inscriptions-annuelles/inscription-annuelle.entity';
import { MontantCotisation } from '../montants-cotisation/montant-cotisation.entity';

export type StatutAnneeAcademique = 'brouillon' | 'ouverte' | 'fermee';

@Entity('annees_academiques')
export class AnneeAcademique {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20 })
  libelle: string;

  @Column({ type: 'date', name: 'date_debut' })
  dateDebut: string;

  @Column({ type: 'date', name: 'date_fin' })
  dateFin: string;

  @Column({ length: 20, default: 'brouillon' })
  statut: StatutAnneeAcademique;

  @Column({ default: false })
  active: boolean;

  @Column({ type: 'timestamp', name: 'cotisations_generees_le', nullable: true })
  cotisationsGenereesLe?: Date;

  @OneToMany(() => InscriptionAnnuelle, (inscription) => inscription.anneeAcademique)
  inscriptions: InscriptionAnnuelle[];

  @OneToMany(() => MontantCotisation, (montant) => montant.anneeAcademique)
  montantsCotisation: MontantCotisation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
