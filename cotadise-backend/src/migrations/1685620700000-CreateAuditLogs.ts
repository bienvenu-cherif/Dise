import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateAuditLogs1685620700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'action', type: 'varchar', length: '80' },
          { name: 'entityType', type: 'varchar', length: '80' },
          { name: 'entityId', type: 'varchar', length: '120', isNullable: true },
          { name: 'actorType', type: 'varchar', length: '40', default: "'application'" },
          { name: 'actorId', type: 'uuid', isNullable: true },
          { name: 'details', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
    await queryRunner.createForeignKey(
      'audit_logs',
      new TableForeignKey({
        columnNames: ['actorId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createIndices('audit_logs', [
      new TableIndex({ name: 'IDX_audit_entity', columnNames: ['entityType', 'entityId'] }),
      new TableIndex({ name: 'IDX_audit_action', columnNames: ['action'] }),
      new TableIndex({ name: 'IDX_audit_created_at', columnNames: ['created_at'] }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs');
  }
}
