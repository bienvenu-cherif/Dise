import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateCotisationsTable1685620100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'cotisations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '150',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'float',
            default: 0,
          },
          {
            name: 'paidAmount',
            type: 'float',
            default: 0,
          },
          {
            name: 'dueDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          {
            name: 'paid',
            type: 'boolean',
            default: false,
          },
          {
            name: 'paidAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
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

    await queryRunner.createForeignKey(
      'cotisations',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('cotisations');
    if (!table) {
      return;
    }
    const foreignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf('userId') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('cotisations', foreignKey);
    }
    await queryRunner.dropTable('cotisations');
  }
}
