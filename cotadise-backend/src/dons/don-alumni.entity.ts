import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

export type StatutDonAlumni = 'initie' | 'en_attente' | 'confirme' | 'echoue' | 'annule';
export type OrigineDonAlumni = 'don_wave' | 'don_main_a_main' | 'ajustement_tresorier';

@Entity('dons_alumni')
export class DonAlumni {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  alumni: User;

  @ManyToOne(() => User, { eager: true, nullable: true })
  recordedBy?: User;

  @Column({ type: 'float' })
  amount: number;

  @Column({ length: 30, default: 'Wave' })
  method: string;

  @Column({ length: 30, default: 'confirme' })
  status: StatutDonAlumni;

  @Column({ length: 40, default: 'don_wave' })
  origin: OrigineDonAlumni;

  @Column({ length: 150, nullable: true })
  reference?: string;

  @Column({ length: 20, nullable: true })
  payerPhone?: string;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  donatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
