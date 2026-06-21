import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('adherents')
export class Adherent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'membership_number', unique: true, length: 50 })
  membershipNumber: string;

  @OneToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 255, nullable: true })
  address?: string;

  @Column({ type: 'date', nullable: true })
  birthDate?: string;

  @Column({ length: 40, default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
