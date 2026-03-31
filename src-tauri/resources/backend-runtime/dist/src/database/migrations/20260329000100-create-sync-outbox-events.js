"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSyncOutboxEvents20260329000100 = void 0;
const migration_database_util_1 = require("../migration-database.util");
class CreateSyncOutboxEvents20260329000100 {
    name = 'CreateSyncOutboxEvents20260329000100';
    async up(queryRunner) {
        if (await queryRunner.hasTable('sync_outbox_events')) {
            return;
        }
        const databaseType = (0, migration_database_util_1.getMigrationDatabaseType)(queryRunner);
        const enumType = databaseType === 'sqlite'
            ? 'varchar'
            : '"public"."sync_outbox_events_operation_enum"';
        const statusEnumType = databaseType === 'sqlite'
            ? 'varchar'
            : '"public"."sync_outbox_events_status_enum"';
        const jsonType = databaseType === 'sqlite' ? 'text' : 'jsonb';
        const timestampType = databaseType === 'sqlite' ? 'datetime' : 'timestamp';
        const nowExpression = databaseType === 'sqlite' ? "datetime('now')" : 'CURRENT_TIMESTAMP';
        const pendingDefault = databaseType === 'sqlite' ? "'pending'" : "'pending'";
        if (databaseType === 'postgres') {
            await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_type WHERE typname = 'sync_outbox_events_operation_enum'
          ) THEN
            CREATE TYPE "public"."sync_outbox_events_operation_enum" AS ENUM ('upsert', 'delete');
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_type WHERE typname = 'sync_outbox_events_status_enum'
          ) THEN
            CREATE TYPE "public"."sync_outbox_events_status_enum" AS ENUM ('pending', 'processing', 'synced', 'failed');
          END IF;
        END$$;
      `);
        }
        const operationDefinition = databaseType === 'sqlite'
            ? `"operation" ${enumType} CHECK( "operation" IN ('upsert','delete') ) NOT NULL`
            : `"operation" ${enumType} NOT NULL`;
        const statusDefinition = databaseType === 'sqlite'
            ? `"status" ${statusEnumType} CHECK( "status" IN ('pending','processing','synced','failed') ) NOT NULL DEFAULT (${pendingDefault})`
            : `"status" ${statusEnumType} NOT NULL DEFAULT 'pending'`;
        const payloadDefault = databaseType === 'sqlite' ? "DEFAULT ('{}')" : `DEFAULT '{}'::jsonb`;
        await queryRunner.query(`
      CREATE TABLE "sync_outbox_events" (
        "id" ${databaseType === 'sqlite' ? 'integer PRIMARY KEY AUTOINCREMENT' : 'SERIAL PRIMARY KEY'} NOT NULL,
        "resource_type" varchar(120) NOT NULL,
        "resource_public_id" varchar(36) NOT NULL,
        "resource_local_id" varchar(64),
        ${operationDefinition},
        ${statusDefinition},
        "sync_version" integer NOT NULL DEFAULT (1),
        "sync_origin" varchar(32),
        "payload" ${jsonType} NOT NULL ${payloadDefault},
        "attempts" integer NOT NULL DEFAULT (0),
        "last_error" text,
        "available_at" ${timestampType} NOT NULL DEFAULT (${nowExpression}),
        "processed_at" ${timestampType},
        "created_at" ${timestampType} NOT NULL DEFAULT (${nowExpression}),
        "updated_at" ${timestampType} NOT NULL DEFAULT (${nowExpression})
      )
    `);
        await queryRunner.query(`
      CREATE INDEX "idx_sync_outbox_status_available"
      ON "sync_outbox_events" ("status", "available_at")
    `);
        await queryRunner.query(`
      CREATE INDEX "idx_sync_outbox_resource_pending"
      ON "sync_outbox_events" ("resource_type", "resource_public_id", "status")
    `);
    }
    async down(queryRunner) {
        if (!(await queryRunner.hasTable('sync_outbox_events'))) {
            return;
        }
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_sync_outbox_resource_pending"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_sync_outbox_status_available"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "sync_outbox_events"`);
        if ((0, migration_database_util_1.getMigrationDatabaseType)(queryRunner) === 'postgres') {
            await queryRunner.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM pg_type WHERE typname = 'sync_outbox_events_status_enum'
          ) THEN
            DROP TYPE "public"."sync_outbox_events_status_enum";
          END IF;

          IF EXISTS (
            SELECT 1 FROM pg_type WHERE typname = 'sync_outbox_events_operation_enum'
          ) THEN
            DROP TYPE "public"."sync_outbox_events_operation_enum";
          END IF;
        END$$;
      `);
        }
    }
}
exports.CreateSyncOutboxEvents20260329000100 = CreateSyncOutboxEvents20260329000100;
//# sourceMappingURL=20260329000100-create-sync-outbox-events.js.map