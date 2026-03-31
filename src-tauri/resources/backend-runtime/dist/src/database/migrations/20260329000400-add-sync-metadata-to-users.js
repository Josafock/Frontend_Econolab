"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSyncMetadataToUsers20260329000400 = void 0;
const node_crypto_1 = require("node:crypto");
const migration_database_util_1 = require("../migration-database.util");
class AddSyncMetadataToUsers20260329000400 {
    name = 'AddSyncMetadataToUsers20260329000400';
    async up(queryRunner) {
        const tableName = 'user';
        await (0, migration_database_util_1.addColumnIfMissing)(queryRunner, tableName, 'public_id', '"public_id" character varying(36)');
        await (0, migration_database_util_1.addColumnIfMissing)(queryRunner, tableName, 'sync_version', '"sync_version" integer NOT NULL DEFAULT 1');
        await (0, migration_database_util_1.addColumnIfMissing)(queryRunner, tableName, 'last_synced_version', '"last_synced_version" integer NOT NULL DEFAULT 0');
        await (0, migration_database_util_1.addColumnIfMissing)(queryRunner, tableName, 'sync_origin', `"sync_origin" character varying(32) NOT NULL DEFAULT 'server'`);
        await (0, migration_database_util_1.addColumnIfMissing)(queryRunner, tableName, 'last_synced_at', '"last_synced_at" timestamp NULL');
        await (0, migration_database_util_1.addColumnIfMissing)(queryRunner, tableName, 'deleted_at', '"deleted_at" timestamp NULL');
        const rows = (await queryRunner.query(`SELECT "id" FROM "${tableName}" WHERE "public_id" IS NULL`));
        for (const row of rows) {
            await queryRunner.query(`UPDATE "${tableName}" SET "public_id" = '${(0, node_crypto_1.randomUUID)()}' WHERE "id" = ${Number(row.id)}`);
        }
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_${tableName}_public_id"
      ON "${tableName}" ("public_id")
    `);
    }
    async down(queryRunner) {
        const tableName = 'user';
        await queryRunner.query(`
      DROP INDEX IF EXISTS "uq_${tableName}_public_id"
    `);
        await (0, migration_database_util_1.dropColumnIfExists)(queryRunner, tableName, 'deleted_at');
        await (0, migration_database_util_1.dropColumnIfExists)(queryRunner, tableName, 'last_synced_at');
        await (0, migration_database_util_1.dropColumnIfExists)(queryRunner, tableName, 'sync_origin');
        await (0, migration_database_util_1.dropColumnIfExists)(queryRunner, tableName, 'last_synced_version');
        await (0, migration_database_util_1.dropColumnIfExists)(queryRunner, tableName, 'sync_version');
        await (0, migration_database_util_1.dropColumnIfExists)(queryRunner, tableName, 'public_id');
    }
}
exports.AddSyncMetadataToUsers20260329000400 = AddSyncMetadataToUsers20260329000400;
//# sourceMappingURL=20260329000400-add-sync-metadata-to-users.js.map