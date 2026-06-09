import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateAcademicYearBusinessTables1685620500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accountStatus" varchar(30) NOT NULL DEFAULT \'actif\'');
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "entrySource" varchar(30) NOT NULL DEFAULT \'creation_manuelle\'');
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" boolean NOT NULL DEFAULT false');
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "wavePhone" varchar(20)');
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "wavePhoneVerified" boolean NOT NULL DEFAULT false');
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "promotionSortante" varchar(50)');
    await queryRunner.query('ALTER TABLE "paiements" ADD COLUMN IF NOT EXISTS "status" varchar(30) NOT NULL DEFAULT \'confirme\'');
    await queryRunner.query('ALTER TABLE "paiements" ADD COLUMN IF NOT EXISTS "origin" varchar(40) NOT NULL DEFAULT \'paiement_personnel\'');
    await queryRunner.query('ALTER TABLE "paiements" ADD COLUMN IF NOT EXISTS "payerPhone" varchar(20)');
    await queryRunner.query('ALTER TABLE "paiements" ADD COLUMN IF NOT EXISTS "note" varchar(150)');
    await queryRunner.query('ALTER TABLE "paiements" ADD COLUMN IF NOT EXISTS "payerId" uuid');
    await queryRunner.query('ALTER TABLE "paiements" ADD COLUMN IF NOT EXISTS "recordedById" uuid');
    await queryRunner.query(
      'ALTER TABLE "paiements" ADD CONSTRAINT "FK_paiements_payer" FOREIGN KEY ("payerId") REFERENCES "users"("id") ON DELETE SET NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "paiements" ADD CONSTRAINT "FK_paiements_recorded_by" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL',
    );
    await queryRunner.createTable(
      new Table({
        name: 'annees_academiques',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'libelle',
            type: 'varchar',
            length: '20',
            isUnique: true,
          },
          {
            name: 'date_debut',
            type: 'date',
          },
          {
            name: 'date_fin',
            type: 'date',
          },
          {
            name: 'statut',
            type: 'varchar',
            length: '20',
            default: "'brouillon'",
          },
          {
            name: 'active',
            type: 'boolean',
            default: false,
          },
          {
            name: 'cotisations_generees_le',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.query('ALTER TABLE "cotisations" ADD COLUMN IF NOT EXISTS "anneeAcademiqueId" uuid');
    await queryRunner.query('ALTER TABLE "cotisations" ADD COLUMN IF NOT EXISTS "sourceMontant" varchar(30)');
    await queryRunner.query(
      'ALTER TABLE "cotisations" ADD CONSTRAINT "FK_cotisations_annee_academique" FOREIGN KEY ("anneeAcademiqueId") REFERENCES "annees_academiques"("id") ON DELETE SET NULL',
    );

    await queryRunner.createTable(
      new Table({
        name: 'inscriptions_annuelles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'anneeAcademiqueId',
            type: 'uuid',
          },
          {
            name: 'levelId',
            type: 'uuid',
          },
          {
            name: 'statutScolaire',
            type: 'varchar',
            length: '30',
            default: "'actif'",
          },
          {
            name: 'eligibleCotisation',
            type: 'boolean',
            default: true,
          },
          {
            name: 'commentaire',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        uniques: [
          {
            name: 'UQ_inscriptions_annuelles_user_annee',
            columnNames: ['userId', 'anneeAcademiqueId'],
          },
        ],
      }),
    );

    await queryRunner.createForeignKeys('inscriptions_annuelles', [
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['anneeAcademiqueId'],
        referencedTableName: 'annees_academiques',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['levelId'],
        referencedTableName: 'academic_levels',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'montants_cotisation',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'anneeAcademiqueId',
            type: 'uuid',
          },
          {
            name: 'levelId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '20',
            default: "'niveau'",
          },
          {
            name: 'montant',
            type: 'float',
          },
          {
            name: 'date_limite',
            type: 'date',
          },
          {
            name: 'commentaire',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.createForeignKeys('montants_cotisation', [
      new TableForeignKey({
        columnNames: ['anneeAcademiqueId'],
        referencedTableName: 'annees_academiques',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['levelId'],
        referencedTableName: 'academic_levels',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_montants_cotisation_niveau" ON "montants_cotisation" ("anneeAcademiqueId", "levelId") WHERE "type" = \'niveau\' AND "levelId" IS NOT NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_montants_cotisation_exception" ON "montants_cotisation" ("anneeAcademiqueId", "userId") WHERE "type" = \'exception\' AND "userId" IS NOT NULL',
    );

    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'recipientId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'senderId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'anneeAcademiqueId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'canal',
            type: 'varchar',
            length: '30',
            default: "'application'",
          },
          {
            name: 'title',
            type: 'varchar',
            length: '150',
          },
          {
            name: 'message',
            type: 'text',
          },
          {
            name: 'promotionSortante',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'read',
            type: 'boolean',
            default: false,
          },
          {
            name: 'readAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'emailSent',
            type: 'boolean',
            default: false,
          },
          {
            name: 'emailSentAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.createForeignKeys('notifications', [
      new TableForeignKey({
        columnNames: ['recipientId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['senderId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        columnNames: ['anneeAcademiqueId'],
        referencedTableName: 'annees_academiques',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'email_messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'notificationId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'recipientId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'recipientEmail',
            type: 'varchar',
            length: '150',
          },
          {
            name: 'recipientName',
            type: 'varchar',
            length: '150',
            isNullable: true,
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '150',
          },
          {
            name: 'body',
            type: 'text',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'en_attente'",
          },
          {
            name: 'attempts',
            type: 'int',
            default: 0,
          },
          {
            name: 'lastError',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'sentAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('email_messages', [
      new TableForeignKey({
        columnNames: ['notificationId'],
        referencedTableName: 'notifications',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        columnNames: ['recipientId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'defis',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'challengerId',
            type: 'uuid',
          },
          {
            name: 'opponentId',
            type: 'uuid',
          },
          {
            name: 'anneeAcademiqueId',
            type: 'uuid',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'en_attente'",
          },
          {
            name: 'winnerId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'acceptedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'refusedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'cancelledAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('defis', [
      new TableForeignKey({
        columnNames: ['challengerId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['opponentId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['anneeAcademiqueId'],
        referencedTableName: 'annees_academiques',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['winnerId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'dons_alumni',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'alumniId',
            type: 'uuid',
          },
          {
            name: 'recordedById',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'float',
          },
          {
            name: 'method',
            type: 'varchar',
            length: '30',
            default: "'Wave'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '30',
            default: "'confirme'",
          },
          {
            name: 'origin',
            type: 'varchar',
            length: '40',
            default: "'don_wave'",
          },
          {
            name: 'reference',
            type: 'varchar',
            length: '150',
            isNullable: true,
          },
          {
            name: 'payerPhone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'donatedAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('dons_alumni', [
      new TableForeignKey({
        columnNames: ['alumniId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['recordedById'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('dons_alumni');
    await queryRunner.dropTable('defis');
    await queryRunner.dropTable('email_messages');
    await queryRunner.dropTable('notifications');
    await queryRunner.query('DROP INDEX IF EXISTS "UQ_montants_cotisation_exception"');
    await queryRunner.query('DROP INDEX IF EXISTS "UQ_montants_cotisation_niveau"');
    await queryRunner.query('ALTER TABLE "cotisations" DROP CONSTRAINT IF EXISTS "FK_cotisations_annee_academique"');
    await queryRunner.query('ALTER TABLE "cotisations" DROP COLUMN IF EXISTS "sourceMontant"');
    await queryRunner.query('ALTER TABLE "cotisations" DROP COLUMN IF EXISTS "anneeAcademiqueId"');
    await queryRunner.dropTable('montants_cotisation');
    await queryRunner.dropTable('inscriptions_annuelles');
    await queryRunner.dropTable('annees_academiques');
    await queryRunner.query('ALTER TABLE "paiements" DROP CONSTRAINT IF EXISTS "FK_paiements_recorded_by"');
    await queryRunner.query('ALTER TABLE "paiements" DROP CONSTRAINT IF EXISTS "FK_paiements_payer"');
    await queryRunner.query('ALTER TABLE "paiements" DROP COLUMN IF EXISTS "recordedById"');
    await queryRunner.query('ALTER TABLE "paiements" DROP COLUMN IF EXISTS "payerId"');
    await queryRunner.query('ALTER TABLE "paiements" DROP COLUMN IF EXISTS "note"');
    await queryRunner.query('ALTER TABLE "paiements" DROP COLUMN IF EXISTS "payerPhone"');
    await queryRunner.query('ALTER TABLE "paiements" DROP COLUMN IF EXISTS "origin"');
    await queryRunner.query('ALTER TABLE "paiements" DROP COLUMN IF EXISTS "status"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "promotionSortante"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "wavePhoneVerified"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "wavePhone"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "emailVerified"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "entrySource"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "accountStatus"');
  }
}
