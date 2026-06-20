import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActivationCodeToUsers1685620900000 implements MigrationInterface {
  name = 'AddActivationCodeToUsers1685620900000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "activationCodeHash" varchar(255)');
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "activationCodeExpiresAt" timestamp');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "activationCodeExpiresAt"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "activationCodeHash"');
  }
}
