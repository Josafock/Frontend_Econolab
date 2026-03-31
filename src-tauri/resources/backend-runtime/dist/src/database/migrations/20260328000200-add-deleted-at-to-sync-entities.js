"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddDeletedAtToSyncEntities20260328000200 = void 0;
const migration_database_util_1 = require("../migration-database.util");
const SYNC_DELETE_TABLES = [
    'patients',
    'doctors',
    'studies',
    'study_details',
    'service_orders',
    'service_order_items',
    'study_results',
    'study_result_values',
];
class AddDeletedAtToSyncEntities20260328000200 {
    name = 'AddDeletedAtToSyncEntities20260328000200';
    async up(queryRunner) {
        for (const tableName of SYNC_DELETE_TABLES) {
            await (0, migration_database_util_1.addColumnIfMissing)(queryRunner, tableName, 'deleted_at', '"deleted_at" timestamp NULL');
        }
    }
    async down(queryRunner) {
        for (const tableName of SYNC_DELETE_TABLES) {
            await (0, migration_database_util_1.dropColumnIfExists)(queryRunner, tableName, 'deleted_at');
        }
    }
}
exports.AddDeletedAtToSyncEntities20260328000200 = AddDeletedAtToSyncEntities20260328000200;
//# sourceMappingURL=20260328000200-add-deleted-at-to-sync-entities.js.map