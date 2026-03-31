import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddSyncMetadataToCoreEntities20260328000100 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
