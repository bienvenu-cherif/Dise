import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateAdherentsTable1685620300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'adherents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'membership_number',
            type: 'varchar',
            length: '50',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'address',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'birthDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '40',
            default: "'active'",
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
      'adherents',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('adherents');
    if (!table) {
      return;
    }

    const userFk = table.foreignKeys.find((fk) => fk.columnNames.indexOf('user_id') !== -1);
    if (userFk) {
      await queryRunner.dropForeignKey('adherents', userFk);
    }

    await queryRunner.dropTable('adherents');
  }
}
