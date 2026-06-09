import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUserByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        passwordHash: true,
        role: true,
        accountStatus: true,
        isActive: true,
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
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
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
        role: user.role,
      },
    };
  }
}
