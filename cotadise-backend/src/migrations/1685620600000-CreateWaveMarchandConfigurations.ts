import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateWaveMarchandConfigurations1685620600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'wave_marchand_configurations',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'nomCompte', type: 'varchar', length: '150' },
          { name: 'nomBureau', type: 'varchar', length: '150', isNullable: true },
          { name: 'checkoutUrl', type: 'varchar', length: '255' },
          { name: 'currency', type: 'varchar', length: '10', default: "'XOF'" },
          { name: 'successUrl', type: 'varchar', length: '255', isNullable: true },
          { name: 'errorUrl', type: 'varchar', length: '255', isNullable: true },
          { name: 'webhookUrl', type: 'varchar', length: '255', isNullable: true },
          { name: 'api_key_encrypted', type: 'text' },
          { name: 'webhook_secret_encrypted', type: 'text', isNullable: true },
          { name: 'statut', type: 'varchar', length: '30', default: "'brouillon'" },
          { name: 'active', type: 'boolean', default: false },
          { name: 'activee_le', type: 'timestamp', isNullable: true },
          { name: 'validee_le', type: 'timestamp', isNullable: true },
          { name: 'dernier_test_le', type: 'timestamp', isNullable: true },
          { name: 'derniere_reference_test', type: 'varchar', length: '150', isNullable: true },
          { name: 'anneeAcademiqueId', type: 'uuid' },
          { name: 'configureParId', type: 'uuid', isNullable: true },
          { name: 'valideParId', type: 'uuid', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('wave_marchand_configurations', [
      new TableForeignKey({
        columnNames: ['anneeAcademiqueId'],
        referencedTableName: 'annees_academiques',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['configureParId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        columnNames: ['valideParId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);

    await queryRunner.createIndex(
      'wave_marchand_configurations',
      new TableIndex({
        name: 'IDX_wave_config_annee_active',
        columnNames: ['anneeAcademiqueId', 'active'],
      }),
    );

    await queryRunner.query('ALTER TABLE "paiements" ADD COLUMN IF NOT EXISTS "waveConfigurationId" uuid');
    await queryRunner.query('ALTER TABLE "paiements" ADD COLUMN IF NOT EXISTS "appliedAmount" double precision NOT NULL DEFAULT 0');
    await queryRunner.query('ALTER TABLE "paiements" ADD COLUMN IF NOT EXISTS "appliedAt" timestamp');
    await queryRunner.createForeignKey(
      'paiements',
      new TableForeignKey({
        name: 'FK_paiements_wave_configuration',
        columnNames: ['waveConfigurationId'],
        referencedTableName: 'wave_marchand_configurations',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "paiements" DROP CONSTRAINT IF EXISTS "FK_paiements_wave_configuration"');
    await queryRunner.query('ALTER TABLE "paiements" DROP COLUMN IF EXISTS "appliedAt"');
    await queryRunner.query('ALTER TABLE "paiements" DROP COLUMN IF EXISTS "appliedAmount"');
    await queryRunner.query('ALTER TABLE "paiements" DROP COLUMN IF EXISTS "waveConfigurationId"');
    await queryRunner.dropIndex('wave_marchand_configurations', 'IDX_wave_config_annee_active');
    await queryRunner.dropTable('wave_marchand_configurations');
  }
}
