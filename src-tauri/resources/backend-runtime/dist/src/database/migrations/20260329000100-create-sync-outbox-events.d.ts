import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class CreateSyncOutboxEvents20260329000100 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
