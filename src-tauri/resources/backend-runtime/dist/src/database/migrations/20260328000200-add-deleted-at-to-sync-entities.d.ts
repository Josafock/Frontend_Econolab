import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddDeletedAtToSyncEntities20260328000200 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
