import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class BackfillMissingSyncPublicIds20260331000100 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
