import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as xlsx from 'xlsx';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { AcademicLevel } from '../levels/academic-level.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(AcademicLevel)
    private readonly levelsRepository: Repository<AcademicLevel>,
  ) {}

  async create(createUserDto: CreateUserDto, role = 'etudiant'): Promise<User> {
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const { levelId, password, role: dtoRole, ...userData } = createUserDto;
    const user = this.usersRepository.create({
      ...userData,
      passwordHash,
      role: dtoRole ?? role,
    });

    if (levelId) {
      const level = await this.levelsRepository.findOne({ where: { id: levelId } });
      if (!level) {
        throw new NotFoundException(`Academic level with id ${levelId} not found`);
      }
      user.level = level;
    }

    const saved = await this.usersRepository.save(user);
    (saved as any).passwordHash = undefined;
    return saved;
  }

  async importFromExcel(file: Express.Multer.File): Promise<Array<{ email: string; password: string; status: string; message?: string }>> {
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

    const results: Array<{ email: string; password: string; status: string; message?: string }> = [];

    for (const rawRow of rows) {
      const row: Record<string, string> = {};
      for (const [key, value] of Object.entries(rawRow)) {
        row[key.toString().trim().toLowerCase()] = String(value).trim();
      }

      const firstName = row['firstname'] || row['first name'] || row['prenom'] || row['prénom'];
      const lastName = row['lastname'] || row['last name'] || row['nom'];
      const email = row['email'];
      const phone = row['phone'] || row['telephone'] || row['téléphone'];
      const levelName = row['level'] || row['levelname'] || row['niveau'];
      const role = row['role'] || 'etudiant';
      const password = row['password'] || this.generatePassword();

      if (!firstName || !lastName || !email) {
        results.push({
          email: email || '<missing>',
          password,
          status: 'skipped',
          message: 'Missing required firstName, lastName or email',
        });
        continue;
      }

      const existingUser = await this.usersRepository.findOne({ where: { email } });
      if (existingUser) {
        results.push({ email, password, status: 'skipped', message: 'Email already exists' });
        continue;
      }

      let levelId: string | undefined;
      if (levelName) {
        const existingLevel = await this.levelsRepository.findOne({ where: { name: levelName } });
        if (!existingLevel) {
          results.push({ email, password, status: 'skipped', message: `Academic level '${levelName}' not found` });
          continue;
        }
        levelId = existingLevel.id;
      }

      try {
        await this.create(
          {
            firstName,
            lastName,
            email,
            phone,
            password,
            levelId,
            role,
          },
          role,
        );
        results.push({ email, password, status: 'created' });
      } catch (error: any) {
        results.push({ email, password, status: 'error', message: error.message });
      }
    }

    return results;
  }

  private generatePassword(): string {
    return Math.random().toString(36).slice(-8) + 'A1!';
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (updateUserDto.password) {
      user.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
      delete updateUserDto.password;
    }

    if (updateUserDto.levelId) {
      const level = await this.levelsRepository.findOne({ where: { id: updateUserDto.levelId } });
      if (!level) {
        throw new NotFoundException(`Academic level with id ${updateUserDto.levelId} not found`);
      }
      user.level = level;
    }

    const { levelId, ...rest } = updateUserDto;
    Object.assign(user, rest);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }
}
