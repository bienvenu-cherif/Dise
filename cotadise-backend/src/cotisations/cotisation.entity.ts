import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AnneeAcademique } from '../annees-academiques/annee-academique.entity';
import { User } from '../users/user.entity';

@Entity('cotisations')
export class Cotisation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'float', default: 0 })
  amount: number;

  @Column({ type: 'float', default: 0 })
  paidAmount: number;

  @Column({ type: 'date' })
  dueDate: string;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ default: false })
  paid: boolean;

  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => AnneeAcademique, { eager: true, nullable: true })
  anneeAcademique?: AnneeAcademique;

  @Column({ length: 30, nullable: true })
  sourceMontant?: string;

  get remainingAmount(): number {
    return Math.max(0, this.amount - this.paidAmount);
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
