import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddLastSyncedVersionToSyncEntities20260329000300 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
