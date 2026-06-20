import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

@Injectable()
export class WaveSecretVaultService {
  constructor(private readonly configService: ConfigService) {}

  encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join('.');
  }

  decrypt(value: string): string {
    const [ivValue, authTagValue, encryptedValue] = value.split('.');
    const decipher = createDecipheriv('aes-256-gcm', this.getKey(), Buffer.from(ivValue, 'base64'));
    decipher.setAuthTag(Buffer.from(authTagValue, 'base64'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64')), decipher.final()]);
    return decrypted.toString('utf8');
  }

  private getKey(): Buffer {
    const secret =
      this.configService.get<string>('WAVE_CONFIG_ENCRYPTION_KEY') ??
      this.configService.get<string>('APP_SECRET') ??
      this.configService.get<string>('JWT_SECRET') ??
      'cotadise-development-secret';
    return createHash('sha256').update(secret).digest();
  }
}
