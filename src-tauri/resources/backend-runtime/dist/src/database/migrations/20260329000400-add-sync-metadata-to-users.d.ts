import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddSyncMetadataToUsers20260329000400 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
