"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLastSyncedVersionToSyncEntities20260329000300 = void 0;
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
class AddLastSyncedVersionToSyncEntities20260329000300 {
    name = 'AddLastSyncedVersionToSyncEntities20260329000300';
    async up(queryRunner) {
        for (const tableName of SYNC_METADATA_TABLES) {
            await (0, migration_database_util_1.addColumnIfMissing)(queryRunner, tableName, 'last_synced_version', '"last_synced_version" integer NOT NULL DEFAULT 0');
            await queryRunner.query(`
        UPDATE "${tableName}"
        SET "last_synced_version" = CASE
          WHEN "last_synced_at" IS NULL THEN 0
          ELSE COALESCE("sync_version", 1)
        END
        WHERE "last_synced_version" IS NULL
           OR "last_synced_version" < 0
      `);
        }
    }
    async down(queryRunner) {
        for (const tableName of SYNC_METADATA_TABLES) {
            await (0, migration_database_util_1.dropColumnIfExists)(queryRunner, tableName, 'last_synced_version');
        }
    }
}
exports.AddLastSyncedVersionToSyncEntities20260329000300 = AddLastSyncedVersionToSyncEntities20260329000300;
//# sourceMappingURL=20260329000300-add-last-synced-version-to-sync-entities.js.map