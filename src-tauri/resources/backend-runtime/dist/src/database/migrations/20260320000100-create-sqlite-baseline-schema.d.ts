import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class CreateSqliteBaselineSchema20260320000100 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
