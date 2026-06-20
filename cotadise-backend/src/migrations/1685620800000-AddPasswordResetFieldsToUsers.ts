import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetFieldsToUsers1685620800000 implements MigrationInterface {
  name = 'AddPasswordResetFieldsToUsers1685620800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetPasswordCodeHash" varchar(255)');
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetPasswordExpiresAt" timestamp');
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetPasswordRequestedAt" timestamp');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "resetPasswordRequestedAt"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "resetPasswordExpiresAt"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "resetPasswordCodeHash"');
  }
}
