"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackfillMissingSyncPublicIds20260331000100 = void 0;
const node_crypto_1 = require("node:crypto");
const SYNC_PUBLIC_ID_TABLES = [
    'user',
    'patients',
    'doctors',
    'studies',
    'study_details',
    'service_orders',
    'service_order_items',
    'study_results',
    'study_result_values',
];
class BackfillMissingSyncPublicIds20260331000100 {
    name = 'BackfillMissingSyncPublicIds20260331000100';
    async up(queryRunner) {
        for (const tableName of SYNC_PUBLIC_ID_TABLES) {
            if (!(await queryRunner.hasColumn(tableName, 'public_id'))) {
                continue;
            }
            const rows = (await queryRunner.query(`SELECT "id" FROM "${tableName}" WHERE "public_id" IS NULL`));
            for (const row of rows) {
                await queryRunner.query(`UPDATE "${tableName}" SET "public_id" = '${(0, node_crypto_1.randomUUID)()}' WHERE "id" = ${Number(row.id)}`);
            }
        }
    }
    async down() {
    }
}
exports.BackfillMissingSyncPublicIds20260331000100 = BackfillMissingSyncPublicIds20260331000100;
//# sourceMappingURL=20260331000100-backfill-missing-sync-public-ids.js.map