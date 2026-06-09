import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Cotisation } from '../cotisations/cotisation.entity';
import { User } from '../users/user.entity';

@Entity('paiements')
export class Paiement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'float' })
  amount: number;

  @Column({ length: 50 })
  method: string;

  @Column({ length: 150, nullable: true })
  reference?: string;

  @Column({ length: 30, default: 'confirme' })
  status: string;

  @Column({ length: 40, default: 'paiement_personnel' })
  origin: string;

  @Column({ length: 20, nullable: true })
  payerPhone?: string;

  @Column({ length: 150, nullable: true })
  note?: string;

  @ManyToOne(() => Cotisation, { eager: true })
  cotisation: Cotisation;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => User, { eager: true, nullable: true })
  payer?: User;

  @ManyToOne(() => User, { eager: true, nullable: true })
  recordedBy?: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  paidAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
