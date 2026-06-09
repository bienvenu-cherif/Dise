import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreatePaiementsTable1685620200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'paiements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'amount',
            type: 'float',
            isNullable: false,
          },
          {
            name: 'method',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'reference',
            type: 'varchar',
            length: '150',
            isNullable: true,
          },
          {
            name: 'cotisationId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'paidAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
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
      'paiements',
      new TableForeignKey({
        columnNames: ['cotisationId'],
        referencedTableName: 'cotisations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'paiements',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('paiements');
    if (!table) {
      return;
    }

    const cotisationFk = table.foreignKeys.find((fk) => fk.columnNames.indexOf('cotisationId') !== -1);
    if (cotisationFk) {
      await queryRunner.dropForeignKey('paiements', cotisationFk);
    }

    const userFk = table.foreignKeys.find((fk) => fk.columnNames.indexOf('userId') !== -1);
    if (userFk) {
      await queryRunner.dropForeignKey('paiements', userFk);
    }

    await queryRunner.dropTable('paiements');
  }
}
