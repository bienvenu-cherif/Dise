import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AcademicLevel } from '../levels/academic-level.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ length: 20, nullable: true })
  wavePhone?: string;

  @Column({ default: false })
  wavePhoneVerified: boolean;

  @Column({ name: 'password_hash', length: 255, select: false })
  passwordHash: string;

  @Column({ length: 20, default: 'etudiant' })
  role: string;

  @Column({ length: 30, default: 'actif' })
  accountStatus: string;

  @Column({ length: 30, default: 'creation_manuelle' })
  entrySource: string;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ length: 50, nullable: true })
  promotionSortante?: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => AcademicLevel, { eager: true, nullable: true })
  @JoinColumn({ name: 'academic_level_id' })
  level?: AcademicLevel;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
