import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AnneeAcademique } from '../annees-academiques/annee-academique.entity';
import { User } from '../users/user.entity';

export type StatutConfigurationWave = 'brouillon' | 'a_tester' | 'validee' | 'desactivee';

@Entity('wave_marchand_configurations')
export class WaveMarchandConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  nomCompte: string;

  @Column({ length: 150, nullable: true })
  nomBureau?: string;

  @Column({ length: 255 })
  checkoutUrl: string;

  @Column({ length: 10, default: 'XOF' })
  currency: string;

  @Column({ length: 255, nullable: true })
  successUrl?: string;

  @Column({ length: 255, nullable: true })
  errorUrl?: string;

  @Column({ length: 255, nullable: true })
  webhookUrl?: string;

  @Column({ type: 'text', name: 'api_key_encrypted' })
  apiKeyEncrypted: string;

  @Column({ type: 'text', name: 'webhook_secret_encrypted', nullable: true })
  webhookSecretEncrypted?: string;

  @Column({ length: 30, default: 'brouillon' })
  statut: StatutConfigurationWave;

  @Column({ default: false })
  active: boolean;

  @Column({ type: 'timestamp', name: 'activee_le', nullable: true })
  activeeLe?: Date;

  @Column({ type: 'timestamp', name: 'validee_le', nullable: true })
  valideeLe?: Date;

  @Column({ type: 'timestamp', name: 'dernier_test_le', nullable: true })
  dernierTestLe?: Date;

  @Column({ length: 150, name: 'derniere_reference_test', nullable: true })
  derniereReferenceTest?: string;

  @ManyToOne(() => AnneeAcademique, { eager: true })
  anneeAcademique: AnneeAcademique;

  @ManyToOne(() => User, { eager: true, nullable: true })
  configurePar?: User;

  @ManyToOne(() => User, { eager: true, nullable: true })
  validePar?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
