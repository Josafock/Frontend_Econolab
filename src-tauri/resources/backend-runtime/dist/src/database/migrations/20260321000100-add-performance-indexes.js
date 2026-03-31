"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPerformanceIndexes20260321000100 = void 0;
const migration_database_util_1 = require("../migration-database.util");
class AddPerformanceIndexes20260321000100 {
    name = 'AddPerformanceIndexes20260321000100';
    async up(queryRunner) {
        const databaseType = (0, migration_database_util_1.getMigrationDatabaseType)(queryRunner);
        const activeTrue = (0, migration_database_util_1.getSqlBooleanLiteral)(databaseType, true);
        const queries = [
            `
      CREATE INDEX IF NOT EXISTS idx_service_orders_active_created_at
      ON service_orders ("isActive", "createdAt" DESC)
    `,
            `
      CREATE INDEX IF NOT EXISTS idx_service_orders_active_status_created_at
      ON service_orders ("isActive", status, "createdAt" DESC)
    `,
            `
      CREATE INDEX IF NOT EXISTS idx_service_orders_active_branch_created_at
      ON service_orders ("isActive", "branchName", "createdAt" DESC)
    `,
            databaseType === 'sqlite'
                ? `
      CREATE INDEX IF NOT EXISTS idx_service_orders_completed_lab_date
      ON service_orders (date(coalesce("completedAt", "updatedAt", "createdAt")))
      WHERE "isActive" = ${activeTrue} AND status = 'completed'
    `
                : `
      CREATE INDEX IF NOT EXISTS idx_service_orders_completed_lab_date
      ON service_orders (
        (
          date(
            timezone(
              'America/Mexico_City',
              coalesce("completedAt", "updatedAt", "createdAt")
            )
          )
        )
      )
      WHERE "isActive" = ${activeTrue} AND status = 'completed'
    `,
            databaseType === 'sqlite'
                ? `
      CREATE INDEX IF NOT EXISTS idx_service_orders_created_lab_date
      ON service_orders (date("createdAt"))
      WHERE "isActive" = ${activeTrue}
    `
                : `
      CREATE INDEX IF NOT EXISTS idx_service_orders_created_lab_date
      ON service_orders (
        (
          date(
            timezone(
              'America/Mexico_City',
              "createdAt"
            )
          )
        )
      )
      WHERE "isActive" = ${activeTrue}
    `,
            `
      CREATE INDEX IF NOT EXISTS idx_service_order_items_service_order_id
      ON service_order_items (service_order_id)
    `,
            `
      CREATE INDEX IF NOT EXISTS idx_study_results_service_item_active
      ON study_results (service_order_item_id, "isActive")
    `,
            `
      CREATE INDEX IF NOT EXISTS idx_study_results_service_order_active
      ON study_results (service_order_id, "isActive")
    `,
            `
      CREATE UNIQUE INDEX IF NOT EXISTS uq_study_results_active_per_item
      ON study_results (service_order_item_id)
      WHERE "isActive" = ${activeTrue}
    `,
            `
      CREATE INDEX IF NOT EXISTS idx_study_result_values_result_sort
      ON study_result_values (study_result_id, "sortOrder")
    `,
            `
      CREATE INDEX IF NOT EXISTS idx_studies_active_name
      ON studies ("isActive", name)
    `,
            `
      CREATE INDEX IF NOT EXISTS idx_studies_active_status_type_name
      ON studies ("isActive", status, type, name)
    `,
            `
      CREATE INDEX IF NOT EXISTS idx_study_details_study_active_sort
      ON study_details (study_id, "isActive", "sortOrder")
    `,
            `
      CREATE INDEX IF NOT EXISTS idx_patients_active_last_first
      ON patients ("isActive", "lastName", "firstName")
    `,
            `
      CREATE INDEX IF NOT EXISTS idx_doctors_active_last_first
      ON doctors ("isActive", "lastName", "firstName")
    `,
            `
      CREATE INDEX IF NOT EXISTS idx_user_confirmed_role_created_at
      ON "user" (confirmed, rol, "createdAt")
    `,
            `
      CREATE INDEX IF NOT EXISTS idx_user_token
      ON "user" (token)
    `,
            `
      CREATE INDEX IF NOT EXISTS idx_user_session_user_revoked
      ON user_session ("userId", revoked)
    `,
            `
      CREATE INDEX IF NOT EXISTS idx_user_login_logs_created_at
      ON user_login_logs (created_at DESC)
    `,
            `
      CREATE INDEX IF NOT EXISTS idx_user_login_logs_user_created_at
      ON user_login_logs (user_id, created_at DESC)
    `,
        ];
        for (const query of queries) {
            await queryRunner.query(query);
        }
    }
    async down(queryRunner) {
        await queryRunner.query(`
      DROP INDEX IF EXISTS idx_user_login_logs_user_created_at
    `);
        await queryRunner.query(`
      DROP INDEX IF EXISTS idx_user_login_logs_created_at
    `);
        await queryRunner.query(`
      DROP INDEX IF EXISTS idx_user_session_user_revoked
    `);
        await queryRunner.query(`
      DROP INDEX IF EXISTS idx_user_token
    `);
        await queryRunner.query(`
      DROP INDEX IF EXISTS idx_user_confirmed_role_created_at
    `);
        await queryRunner.query(`
      DROP INDEX IF EXISTS idx_doctors_active_last_first
    `);
        await queryRunner.query(`
      DROP INDEX IF EXISTS idx_patients_active_last_first
    `);
        await queryRunner.query(`
      DROP INDEX IF EXISTS idx_study_details_study_active_sort
    `);
        await queryRunner.query(`
      DROP INDEX IF EXISTS idx_studies_active_status_type_name
    `);
        await queryRunner.query(`
      DROP INDEX IF EXISTS idx_studies_active_name
    `);
        await queryRunner.query(`
      DROP INDEX IF EXISTS idx_study_result_values_result_sort
    `);
        await queryRunner.query(`
      DROP INDEX IF EXISTS uq_study_results_active_per_item
    `);
        await queryRunner.query(`
      DROP INDEX IF EXISTS idx_study_results_service_order_active
    `);
        await queryRunner.query(`
      DROP INDEX IF EXISTS idx_study_results_service_item_active
    `);
        await queryRunner.query(`
      DROP INDEX IF EXISTS idx_service_order_items_service_order_id
    `);
        await queryRunner.query(`
      DROP INDEX IF EXISTS idx_service_orders_created_lab_date
    `);
        await queryRunner.query(`
      DROP INDEX IF EXISTS idx_service_orders_completed_lab_date
    `);
        await queryRunner.query(`
      DROP INDEX IF EXISTS idx_service_orders_active_branch_created_at
    `);
        await queryRunner.query(`
      DROP INDEX IF EXISTS idx_service_orders_active_status_created_at
    `);
        await queryRunner.query(`
      DROP INDEX IF EXISTS idx_service_orders_active_created_at
    `);
    }
}
exports.AddPerformanceIndexes20260321000100 = AddPerformanceIndexes20260321000100;
//# sourceMappingURL=20260321000100-add-performance-indexes.js.map