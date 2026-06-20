import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailOutboxService } from '../email-outbox/email-outbox.service';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailOutboxService: EmailOutboxService,
  ) {}

  async validateUserByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: { level: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        wavePhone: true,
        passwordHash: true,
        role: true,
        accountStatus: true,
        isActive: true,
        level: {
          id: true,
          name: true,
          annualAmount: true,
        },
      },
    });
  }

  async validateUser(identifier: string, password: string): Promise<User> {
    const user = await this.validateUserByEmail(identifier);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Utilisateur introuvable ou inactif');
    }
    if (user.accountStatus !== 'actif') {
      throw new UnauthorizedException('Compte non active. Veuillez completer votre profil dans l application mobile');
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Mot de passe incorrect');
    }
    return user;
  }

  async validateUserById(userId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id: userId },
      relations: { level: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        wavePhone: true,
        role: true,
        accountStatus: true,
        isActive: true,
        level: {
          id: true,
          name: true,
          annualAmount: true,
        },
      },
    });
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.identifier, dto.password);
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        wavePhone: user.wavePhone,
        role: user.role,
        accountStatus: user.accountStatus,
        level: user.level,
      },
    };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto): Promise<{ success: true }> {
    const email = dto.email.toLowerCase();
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user || !user.isActive || user.accountStatus !== 'actif') {
      return { success: true };
    }

    const now = new Date();
    if (user.resetPasswordRequestedAt && now.getTime() - user.resetPasswordRequestedAt.getTime() < 5 * 60 * 1000) {
      return { success: true };
    }

    const code = String(randomInt(100000, 1000000));
    user.resetPasswordCodeHash = await bcrypt.hash(code, 10);
    user.resetPasswordExpiresAt = new Date(now.getTime() + 20 * 60 * 1000);
    user.resetPasswordRequestedAt = now;
    await this.usersRepository.save(user);

    const recipientName = [user.firstName, user.lastName].filter(Boolean).join(' ');
    await this.emailOutboxService.queueRawEmail({
      recipient: user,
      recipientEmail: user.email,
      recipientName,
      subject: 'Code de reinitialisation CotaDISE',
      body: [
        `Bonjour ${recipientName || 'cher etudiant'},`,
        '',
        `Votre code de reinitialisation CotaDISE est: ${code}`,
        '',
        'Ce code expire dans 20 minutes. Si vous n avez pas demande cette action, ignorez ce message.',
      ].join('\n'),
    });

    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ success: true }> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .addSelect('user.resetPasswordCodeHash')
      .where('LOWER(user.email) = :email', { email: dto.email.toLowerCase() })
      .getOne();

    if (!user || !user.resetPasswordCodeHash || !user.resetPasswordExpiresAt) {
      throw new BadRequestException('Code de reinitialisation invalide ou expire');
    }
    if (user.resetPasswordExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Code de reinitialisation invalide ou expire');
    }

    const codeValid = await bcrypt.compare(dto.code, user.resetPasswordCodeHash);
    if (!codeValid) {
      throw new BadRequestException('Code de reinitialisation invalide ou expire');
    }
    const samePassword = await bcrypt.compare(dto.newPassword, user.passwordHash);
    if (samePassword) {
      throw new BadRequestException('Le nouveau mot de passe doit etre different de l ancien');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    user.resetPasswordCodeHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    user.resetPasswordRequestedAt = undefined;
    await this.usersRepository.save(user);
    return { success: true };
  }
}
