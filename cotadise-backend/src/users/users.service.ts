import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { xlsxBufferToRows } from '../common/excel.helper';
import { ActivateInvitedUserDto } from './dto/activate-invited-user.dto';
import { ChangeMyPasswordDto } from './dto/change-my-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { PassationBureauDto } from './dto/passation-bureau.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { AcademicLevel } from '../levels/academic-level.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(AcademicLevel)
    private readonly levelsRepository: Repository<AcademicLevel>,
    private readonly auditService: AuditService,
  ) {}

  async create(createUserDto: CreateUserDto, role = 'etudiant', activationCode?: string): Promise<User> {
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const { levelId, password, role: dtoRole, ...userData } = createUserDto;
    const user = this.usersRepository.create({
      ...userData,
      passwordHash,
      wavePhone: createUserDto.wavePhone ?? createUserDto.phone,
      accountStatus: createUserDto.accountStatus ?? 'actif',
      entrySource: createUserDto.entrySource ?? 'creation_manuelle',
      role: dtoRole ?? role,
      activationCodeHash: activationCode ? await bcrypt.hash(activationCode, 10) : undefined,
      activationCodeExpiresAt: activationCode ? new Date(Date.now() + 120 * 24 * 60 * 60 * 1000) : undefined,
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

  async importFromExcel(file: Express.Multer.File): Promise<Array<{ email: string; password: string; activationCode?: string; status: string; message?: string }>> {
    const rows = await xlsxBufferToRows(file.buffer);

    const results: Array<{ email: string; password: string; activationCode?: string; status: string; message?: string }> = [];
    const defaultIse1Level = await this.levelsRepository.findOne({ where: { name: 'ISE1' } });
    if (!defaultIse1Level) {
      throw new BadRequestException('Le niveau ISE1 doit exister avant l import officiel');
    }

    for (const rawRow of rows) {
      const row: Record<string, string> = {};
      for (const [key, value] of Object.entries(rawRow)) {
        row[key.toString().trim().toLowerCase()] = String(value).trim();
      }

      const firstName = row['firstname'] || row['first name'] || row['prenom'] || row['prénom'];
      const lastName = row['lastname'] || row['last name'] || row['nom'];
      const email = row['email'] || this.generateInviteEmail(firstName, lastName);
      const phone = row['phone'] || row['telephone'] || row['téléphone'];
      const levelName = row['level'] || row['levelname'] || row['niveau'] || 'ISE1';
      const role = row['role'] || 'etudiant';
      const password = row['password'] || this.generatePassword();
      const activationCode = this.generateActivationCode();

      if (!firstName || !lastName) {
        results.push({
          email: email || '<missing>',
          password,
          status: 'skipped',
          message: 'Missing required firstName or lastName',
        });
        continue;
      }

      const duplicateInvite = await this.usersRepository
        .createQueryBuilder('user')
        .where('LOWER(user.firstName) = :firstName', { firstName: firstName.toLowerCase() })
        .andWhere('LOWER(user.lastName) = :lastName', { lastName: lastName.toLowerCase() })
        .andWhere('user.entrySource = :entrySource', { entrySource: 'import_officiel' })
        .andWhere('user.accountStatus IN (:...statuses)', { statuses: ['invite', 'profil_a_completer'] })
        .getOne();
      if (duplicateInvite) {
        results.push({
          email: duplicateInvite.email,
          password,
          status: 'skipped',
          message: 'Nom deja present dans la liste officielle invitee',
        });
        continue;
      }

      const existingUser = await this.usersRepository.findOne({ where: { email } });
      if (existingUser) {
        results.push({ email, password, status: 'skipped', message: 'Email already exists' });
        continue;
      }

      let levelId: string | undefined = defaultIse1Level.id;
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
            accountStatus: 'invite',
            entrySource: 'import_officiel',
          },
          role,
          activationCode,
        );
        results.push({ email, password, activationCode, status: 'created' });
      } catch (error: any) {
        results.push({ email, password, status: 'error', message: error.message });
      }
    }

    return results;
  }

  private generatePassword(): string {
    return Math.random().toString(36).slice(-8) + 'A1!';
  }

  private generateActivationCode(): string {
    return randomBytes(6).toString('hex').toUpperCase();
  }

  private generateInviteEmail(firstName?: string, lastName?: string): string {
    const slug =
      [firstName, lastName]
        .filter(Boolean)
        .join('.')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/(^\.|\.$)/g, '') || 'etudiant';
    return `invite.${slug}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@cotadise.local`;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { createdAt: 'DESC' } });
  }

  searchInvitedStudents(query: string): Promise<User[]> {
    const normalizedQuery = query?.trim();
    if (!normalizedQuery || normalizedQuery.length < 2) {
      throw new BadRequestException('Veuillez saisir au moins 2 caracteres pour rechercher votre nom');
    }
    const builder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.level', 'level')
      .where('user.accountStatus IN (:...statuses)', { statuses: ['invite', 'profil_a_completer'] })
      .andWhere('user.entrySource = :entrySource', { entrySource: 'import_officiel' })
      .orderBy('user.lastName', 'ASC')
      .addOrderBy('user.firstName', 'ASC')
      .take(12);

    builder.andWhere(
      '(LOWER(user.firstName) LIKE :query OR LOWER(user.lastName) LIKE :query OR LOWER(user.email) LIKE :query)',
      { query: `%${normalizedQuery.toLowerCase()}%` },
    );

    return builder.getMany();
  }

  searchActiveStudents(query: string, excludeUserId?: string, levelIdOrName?: string): Promise<User[]> {
    const normalizedQuery = query?.trim();
    if (!normalizedQuery || normalizedQuery.length < 2) {
      throw new BadRequestException('Veuillez saisir au moins 2 caracteres pour rechercher un camarade');
    }

    const builder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.level', 'level')
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.phone',
        'user.wavePhone',
        'user.role',
        'user.accountStatus',
        'user.isActive',
        'level.id',
        'level.name',
      ])
      .where('user.role = :role', { role: 'etudiant' })
      .andWhere('user.accountStatus = :accountStatus', { accountStatus: 'actif' })
      .andWhere('user.isActive = true')
      .orderBy('user.lastName', 'ASC')
      .addOrderBy('user.firstName', 'ASC')
      .take(12);

    if (excludeUserId) {
      builder.andWhere('user.id != :excludeUserId', { excludeUserId });
    }

    if (levelIdOrName) {
      const normalizedLevelFilter = levelIdOrName.trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalizedLevelFilter);
      if (isUuid) {
        builder.andWhere('(level.id = :levelFilter OR UPPER(level.name) = :levelFilterName)', {
          levelFilter: normalizedLevelFilter,
          levelFilterName: normalizedLevelFilter.toUpperCase(),
        });
      } else {
        builder.andWhere('UPPER(level.name) = :levelFilterName', {
          levelFilterName: normalizedLevelFilter.toUpperCase(),
        });
      }
    }

    builder.andWhere(
      '(LOWER(user.firstName) LIKE :query OR LOWER(user.lastName) LIKE :query OR LOWER(user.email) LIKE :query)',
      { query: `%${normalizedQuery.toLowerCase()}%` },
    );

    return builder.getMany();
  }

  async activateInvitedStudent(id: string, dto: ActivateInvitedUserDto): Promise<User> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.level', 'level')
      .addSelect('user.activationCodeHash')
      .where('user.id = :id', { id })
      .getOne();
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    if (!['invite', 'profil_a_completer'].includes(user.accountStatus)) {
      throw new BadRequestException('Ce compte est deja active ou ne peut pas etre active depuis ce parcours');
    }
    if (user.entrySource !== 'import_officiel') {
      throw new BadRequestException('Seuls les comptes issus de la liste officielle peuvent etre actives ici');
    }
    if (!user.activationCodeHash || !user.activationCodeExpiresAt || user.activationCodeExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Code d activation absent ou expire. Contactez le tresorier');
    }
    const activationCodeValid = await bcrypt.compare(dto.activationCode.toUpperCase(), user.activationCodeHash);
    if (!activationCodeValid) {
      throw new BadRequestException('Code d activation incorrect');
    }

    const normalizedEmail = dto.email.toLowerCase();
    const existingEmailOwner = await this.usersRepository.findOne({ where: { email: normalizedEmail } });
    if (existingEmailOwner && existingEmailOwner.id !== user.id) {
      throw new BadRequestException('Cet email est deja utilise par un autre compte');
    }

    user.email = normalizedEmail;
    user.phone = dto.phone;
    user.wavePhone = dto.wavePhone ?? dto.phone;
    user.wavePhoneVerified = false;
    user.emailVerified = false;
    user.passwordHash = await bcrypt.hash(dto.password, 10);
    user.accountStatus = 'actif';
    user.isActive = true;
    user.activationCodeHash = undefined;
    user.activationCodeExpiresAt = undefined;

    const saved = await this.usersRepository.save(user);
    (saved as any).passwordHash = undefined;
    (saved as any).activationCodeHash = undefined;
    return saved;
  }

  async regenerateActivationCode(id: string): Promise<{ userId: string; activationCode: string; expiresAt: Date }> {
    const user = await this.findOne(id);
    if (user.entrySource !== 'import_officiel' || !['invite', 'profil_a_completer'].includes(user.accountStatus)) {
      throw new BadRequestException('Seul un compte invite issu de la liste officielle peut recevoir un nouveau code');
    }
    const activationCode = this.generateActivationCode();
    user.activationCodeHash = await bcrypt.hash(activationCode, 10);
    user.activationCodeExpiresAt = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000);
    await this.usersRepository.save(user);
    return { userId: user.id, activationCode, expiresAt: user.activationCodeExpiresAt };
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

  async passationBureau(dto: PassationBureauDto, actorId: string): Promise<{
    nouveauTresorier: User;
    anciensGestionnaires: Array<Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role' | 'accountStatus'>>;
  }> {
    const nouveauTresorier = await this.findOne(dto.nouveauTresorierId);
    if (!nouveauTresorier.isActive) {
      throw new BadRequestException('Le nouveau tresorier doit avoir un compte actif');
    }
    if (!['etudiant', 'tresorier', 'admin'].includes(nouveauTresorier.role)) {
      throw new BadRequestException('Seul un compte etudiant ou gestionnaire actif peut devenir tresorier');
    }
    if (!nouveauTresorier.level || nouveauTresorier.level.name.toLowerCase() === 'alumni') {
      throw new BadRequestException('Le nouveau tresorier doit etre un etudiant ISE actif');
    }

    const anciensGestionnaires = await this.usersRepository.find({
      where: [{ role: 'tresorier' }, { role: 'admin' }],
    });

    const anciensARevoquer = anciensGestionnaires.filter((item) => item.id !== nouveauTresorier.id);
    const anciensAvantPassation = anciensARevoquer.map((item) => ({
      id: item.id,
      email: item.email,
      role: item.role,
    }));
    for (const ancien of anciensARevoquer) {
      if (ancien.level?.name.toLowerCase() === 'alumni' || ancien.accountStatus === 'alumni') {
        ancien.role = 'alumni';
        ancien.accountStatus = 'alumni';
        ancien.isActive = true;
      } else if (ancien.level) {
        ancien.role = 'etudiant';
        ancien.accountStatus = 'actif';
        ancien.isActive = true;
      } else {
        ancien.role = 'etudiant';
        ancien.accountStatus = 'suspendu';
        ancien.isActive = false;
      }
    }

    nouveauTresorier.role = 'tresorier';
    nouveauTresorier.accountStatus = 'actif';
    nouveauTresorier.isActive = true;

    await this.usersRepository.save([...anciensARevoquer, nouveauTresorier]);
    await this.auditService.record({
      action: 'passation_bureau',
      entityType: 'users',
      entityId: nouveauTresorier.id,
      actorId,
      details: {
        nouveauTresorierId: nouveauTresorier.id,
        nouveauTresorierEmail: nouveauTresorier.email,
        anciensGestionnairesRevoques: anciensAvantPassation.map((item) => ({
          id: item.id,
          email: item.email,
          previousRole: item.role,
        })),
        motif: dto.motif,
      },
    });

    return {
      nouveauTresorier,
      anciensGestionnaires: anciensARevoquer.map((item) => ({
        id: item.id,
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email,
        role: item.role,
        accountStatus: item.accountStatus,
      })),
    };
  }

  async updateMyProfile(id: string, dto: UpdateMyProfileDto): Promise<User> {
    const user = await this.findOne(id);
    if (user.role !== 'etudiant') {
      throw new BadRequestException('Seuls les etudiants peuvent modifier ce profil mobile');
    }

    if (dto.email) {
      const normalizedEmail = dto.email.toLowerCase();
      const existingEmailOwner = await this.usersRepository.findOne({ where: { email: normalizedEmail } });
      if (existingEmailOwner && existingEmailOwner.id !== user.id) {
        throw new BadRequestException('Cet email est deja utilise par un autre compte');
      }
      user.email = normalizedEmail;
      user.emailVerified = false;
    }

    if (dto.phone) {
      user.phone = dto.phone;
    }

    if (dto.wavePhone) {
      user.wavePhone = dto.wavePhone;
      user.wavePhoneVerified = false;
    } else if (dto.phone && !user.wavePhone) {
      user.wavePhone = dto.phone;
      user.wavePhoneVerified = false;
    }

    const saved = await this.usersRepository.save(user);
    (saved as any).passwordHash = undefined;
    return saved;
  }

  async changeMyPassword(id: string, dto: ChangeMyPasswordDto): Promise<{ success: true }> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id })
      .getOne();
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    if (user.role !== 'etudiant') {
      throw new BadRequestException('Seuls les etudiants peuvent modifier ce mot de passe depuis le mobile');
    }

    const currentPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!currentPasswordValid) {
      throw new BadRequestException('Mot de passe actuel incorrect');
    }
    const samePassword = await bcrypt.compare(dto.newPassword, user.passwordHash);
    if (samePassword) {
      throw new BadRequestException('Le nouveau mot de passe doit etre different de l ancien');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepository.save(user);
    return { success: true };
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }
}
