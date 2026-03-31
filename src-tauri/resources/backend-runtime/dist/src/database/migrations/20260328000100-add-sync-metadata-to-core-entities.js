"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSyncMetadataToCoreEntities20260328000100 = void 0;
const node_crypto_1 = require("node:crypto");
const migration_database_util_1 = require("../migration-database.util");
const SYNC_METADATA_TABLES = [
    'patients',
    'doctors',
    'studies',
    'study_details',
    'service_orders',
    'service_order_items',
    'study_results',
    'study_result_values',
];
class AddSyncMetadataToCoreEntities20260328000100 {
    name = 'AddSyncMetadataToCoreEntities20260328000100';
    async up(queryRunner) {
        for (const tableName of SYNC_METADATA_TABLES) {
            await (0, migration_database_util_1.addColumnIfMissing)(queryRunner, tableName, 'public_id', '"public_id" character varying(36)');
            await (0, migration_database_util_1.addColumnIfMissing)(queryRunner, tableName, 'sync_version', '"sync_version" integer NOT NULL DEFAULT 1');
            await (0, migration_database_util_1.addColumnIfMissing)(queryRunner, tableName, 'sync_origin', `"sync_origin" character varying(32) NOT NULL DEFAULT 'server'`);
            await (0, migration_database_util_1.addColumnIfMissing)(queryRunner, tableName, 'last_synced_at', '"last_synced_at" timestamp NULL');
        }
        for (const tableName of SYNC_METADATA_TABLES) {
            const rows = (await queryRunner.query(`SELECT "id" FROM "${tableName}" WHERE "public_id" IS NULL`));
            for (const row of rows) {
                await queryRunner.query(`UPDATE "${tableName}" SET "public_id" = '${(0, node_crypto_1.randomUUID)()}' WHERE "id" = ${Number(row.id)}`);
            }
            await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "uq_${tableName}_public_id"
        ON "${tableName}" ("public_id")
      `);
        }
    }
    async down(queryRunner) {
        for (const tableName of SYNC_METADATA_TABLES) {
            await queryRunner.query(`
        DROP INDEX IF EXISTS "uq_${tableName}_public_id"
      `);
            await (0, migration_database_util_1.dropColumnIfExists)(queryRunner, tableName, 'last_synced_at');
            await (0, migration_database_util_1.dropColumnIfExists)(queryRunner, tableName, 'sync_origin');
            await (0, migration_database_util_1.dropColumnIfExists)(queryRunner, tableName, 'sync_version');
            await (0, migration_database_util_1.dropColumnIfExists)(queryRunner, tableName, 'public_id');
        }
    }
}
exports.AddSyncMetadataToCoreEntities20260328000100 = AddSyncMetadataToCoreEntities20260328000100;
//# sourceMappingURL=20260328000100-add-sync-metadata-to-core-entities.js.map