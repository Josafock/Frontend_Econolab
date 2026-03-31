import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddPerformanceIndexes20260321000100 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
