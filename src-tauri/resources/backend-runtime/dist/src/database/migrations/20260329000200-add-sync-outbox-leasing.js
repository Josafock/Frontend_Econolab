"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSyncOutboxLeasing20260329000200 = void 0;
const migration_database_util_1 = require("../migration-database.util");
class AddSyncOutboxLeasing20260329000200 {
    name = 'AddSyncOutboxLeasing20260329000200';
    async up(queryRunner) {
        if (!(await queryRunner.hasTable('sync_outbox_events'))) {
            return;
        }
        const databaseType = (0, migration_database_util_1.getMigrationDatabaseType)(queryRunner);
        const timestampType = databaseType === 'sqlite' ? 'datetime' : 'timestamp';
        await (0, migration_database_util_1.addColumnIfMissing)(queryRunner, 'sync_outbox_events', 'lease_token', `"lease_token" varchar(64)`);
        await (0, migration_database_util_1.addColumnIfMissing)(queryRunner, 'sync_outbox_events', 'leased_at', `"leased_at" ${timestampType}`);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_sync_outbox_lease_token"
      ON "sync_outbox_events" ("lease_token")
    `);
    }
    async down(queryRunner) {
        if (!(await queryRunner.hasTable('sync_outbox_events'))) {
            return;
        }
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_sync_outbox_lease_token"`);
        if (await queryRunner.hasColumn('sync_outbox_events', 'leased_at')) {
            await queryRunner.dropColumn('sync_outbox_events', 'leased_at');
        }
        if (await queryRunner.hasColumn('sync_outbox_events', 'lease_token')) {
            await queryRunner.dropColumn('sync_outbox_events', 'lease_token');
        }
    }
}
exports.AddSyncOutboxLeasing20260329000200 = AddSyncOutboxLeasing20260329000200;
//# sourceMappingURL=20260329000200-add-sync-outbox-leasing.js.map