"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSqliteBaselineSchema20260320000100 = void 0;
const migration_database_util_1 = require("../migration-database.util");
const SQLITE_BASELINE_TABLES = [
    'user',
    'user_session',
    'studies',
    'study_details',
    'patients',
    'doctors',
    'service_orders',
    'service_order_items',
    'study_results',
    'study_result_values',
    'daily_closings',
    'user_login_logs',
];
class CreateSqliteBaselineSchema20260320000100 {
    name = 'CreateSqliteBaselineSchema20260320000100';
    async up(queryRunner) {
        if ((0, migration_database_util_1.getMigrationDatabaseType)(queryRunner) !== 'sqlite') {
            return;
        }
        const existingTables = await Promise.all(SQLITE_BASELINE_TABLES.map((tableName) => queryRunner.hasTable(tableName)));
        const existingCount = existingTables.filter(Boolean).length;
        if (existingCount === SQLITE_BASELINE_TABLES.length) {
            return;
        }
        if (existingCount > 0) {
            throw new Error('Se detecto un schema SQLite parcial. Usa una base nueva para inicializar el baseline local.');
        }
        const createTableStatements = [
            `
      CREATE TABLE "user" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "nombre" varchar(50) NOT NULL,
        "email" varchar(50) NOT NULL,
        "password" varchar(60) NOT NULL,
        "token" varchar(6),
        "confirmed" boolean NOT NULL DEFAULT (0),
        "rol" varchar CHECK( "rol" IN ('admin','recepcionista','unassigned') ) NOT NULL DEFAULT ('unassigned'),
        "profileImageData" text,
        "profileImageMimeType" varchar(100),
        "googleAvatarUrl" varchar(1000),
        "resetTokenExpiresAt" datetime,
        "resetRequestCount" integer NOT NULL DEFAULT (0),
        "resetRequestWindowStart" datetime,
        "failedLoginAttempts" integer NOT NULL DEFAULT (0),
        "lockUntil" datetime,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `,
            `
      CREATE TABLE "user_session" (
        "id" varchar PRIMARY KEY NOT NULL,
        "expiresAt" datetime NOT NULL,
        "revoked" boolean NOT NULL DEFAULT (0),
        "ip" varchar(45),
        "userAgent" text,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "userId" integer,
        CONSTRAINT "FK_b5eb7aa08382591e7c2d1244fe5"
          FOREIGN KEY ("userId") REFERENCES "user" ("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `,
            `
      CREATE TABLE "studies" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar(200) NOT NULL,
        "code" varchar(50) NOT NULL,
        "description" text,
        "durationMinutes" integer NOT NULL DEFAULT (60),
        "type" varchar CHECK( "type" IN ('study','package','other') ) NOT NULL DEFAULT ('study'),
        "normalPrice" decimal(10,2) NOT NULL DEFAULT (0),
        "difPrice" decimal(10,2) NOT NULL DEFAULT (0),
        "specialPrice" decimal(10,2) NOT NULL DEFAULT (0),
        "hospitalPrice" decimal(10,2) NOT NULL DEFAULT (0),
        "otherPrice" decimal(10,2) NOT NULL DEFAULT (0),
        "defaultDiscountPercent" decimal(5,2) NOT NULL DEFAULT (0),
        "method" varchar(150),
        "indicator" varchar(150),
        "packageStudyIds" text NOT NULL DEFAULT ('[]'),
        "status" varchar CHECK( "status" IN ('active','suspended') ) NOT NULL DEFAULT ('active'),
        "isActive" boolean NOT NULL DEFAULT (1),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_70bc3802c9dc98aa38a6422cb69" UNIQUE ("code")
      )
    `,
            `
      CREATE TABLE "study_details" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "study_id" integer NOT NULL,
        "parent_id" integer,
        "dataType" varchar CHECK( "dataType" IN ('category','parameter') ) NOT NULL,
        "name" varchar(150) NOT NULL,
        "sortOrder" integer NOT NULL DEFAULT (1),
        "unit" varchar(50),
        "referenceValue" varchar(255),
        "isActive" boolean NOT NULL DEFAULT (1),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_ce74d5d770e39ad0f6f30a78052"
          FOREIGN KEY ("study_id") REFERENCES "studies" ("id")
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_4fcee6d26193d680407c100a154"
          FOREIGN KEY ("parent_id") REFERENCES "study_details" ("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `,
            `
      CREATE TABLE "patients" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "firstName" varchar(100) NOT NULL,
        "lastName" varchar(100) NOT NULL,
        "middleName" varchar(100),
        "gender" varchar CHECK( "gender" IN ('male','female','other') ) NOT NULL DEFAULT ('other'),
        "birthDate" date NOT NULL,
        "phone" varchar(20),
        "email" varchar(150),
        "addressLine" varchar(255),
        "addressBetween" varchar(255),
        "addressCity" varchar(100),
        "addressState" varchar(100),
        "addressZip" varchar(20),
        "documentType" varchar(20),
        "documentNumber" varchar(50),
        "isActive" boolean NOT NULL DEFAULT (1),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_f3fdfcd4c9943fbbd77c26c942a" UNIQUE ("documentType", "documentNumber")
      )
    `,
            `
      CREATE TABLE "doctors" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "firstName" varchar(100) NOT NULL,
        "lastName" varchar(100) NOT NULL,
        "middleName" varchar(100),
        "email" varchar(150),
        "phone" varchar(20),
        "specialty" varchar(150),
        "licenseNumber" varchar(50),
        "notes" text,
        "isActive" boolean NOT NULL DEFAULT (1),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_764e04456946abd3fbd4155421e" UNIQUE ("licenseNumber")
      )
    `,
            `
      CREATE TABLE "service_orders" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "folio" varchar(50) NOT NULL,
        "patient_id" integer NOT NULL,
        "doctor_id" integer,
        "branchName" varchar(150),
        "sampleAt" datetime,
        "deliveryAt" datetime,
        "completedAt" datetime,
        "status" varchar CHECK( "status" IN ('pending','in_progress','delayed','completed','cancelled') ) NOT NULL DEFAULT ('pending'),
        "subtotalAmount" decimal(10,2) NOT NULL DEFAULT (0),
        "courtesyPercent" decimal(5,2) NOT NULL DEFAULT (0),
        "discountAmount" decimal(10,2) NOT NULL DEFAULT (0),
        "totalAmount" decimal(10,2) NOT NULL DEFAULT (0),
        "notes" text,
        "isActive" boolean NOT NULL DEFAULT (1),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_ee8acede046a925fbb00ff0053c" UNIQUE ("folio"),
        CONSTRAINT "FK_8b0f7b334fb34a74c789ccd018f"
          FOREIGN KEY ("patient_id") REFERENCES "patients" ("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_22a87b10ec2a5b9d939e61768e9"
          FOREIGN KEY ("doctor_id") REFERENCES "doctors" ("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `,
            `
      CREATE TABLE "service_order_items" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "service_order_id" integer NOT NULL,
        "study_id" integer NOT NULL,
        "studyNameSnapshot" varchar(200) NOT NULL,
        "source_package_id" integer,
        "source_package_name_snapshot" varchar(200),
        "priceType" varchar(20) NOT NULL,
        "unitPrice" decimal(10,2) NOT NULL DEFAULT (0),
        "quantity" integer NOT NULL DEFAULT (1),
        "discountPercent" decimal(5,2) NOT NULL DEFAULT (0),
        "subtotalAmount" decimal(10,2) NOT NULL DEFAULT (0),
        CONSTRAINT "FK_e4472d1d912bb7be07fe4eeed27"
          FOREIGN KEY ("service_order_id") REFERENCES "service_orders" ("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `,
            `
      CREATE TABLE "study_results" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "service_order_id" integer NOT NULL,
        "service_order_item_id" integer NOT NULL,
        "sampleAt" datetime,
        "reportedAt" datetime,
        "method" varchar(150),
        "observations" text,
        "isDraft" boolean NOT NULL DEFAULT (1),
        "isActive" boolean NOT NULL DEFAULT (1),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_00e15e46e4afaf45af47fb1d25d"
          FOREIGN KEY ("service_order_id") REFERENCES "service_orders" ("id")
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_9770dae08724b3fc59e83b203ec"
          FOREIGN KEY ("service_order_item_id") REFERENCES "service_order_items" ("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `,
            `
      CREATE TABLE "study_result_values" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "study_result_id" integer NOT NULL,
        "study_detail_id" integer,
        "label" varchar(150) NOT NULL,
        "unit" varchar(50),
        "referenceValue" varchar(255),
        "value" varchar(100),
        "sortOrder" integer NOT NULL DEFAULT (1),
        "visible" boolean NOT NULL DEFAULT (1),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_70d9dc177a06103a92f5b158924"
          FOREIGN KEY ("study_result_id") REFERENCES "study_results" ("id")
          ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_190fc95b150ec44782150d7be45"
          FOREIGN KEY ("study_detail_id") REFERENCES "study_details" ("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `,
            `
      CREATE TABLE "daily_closings" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "closingDate" date NOT NULL,
        "periodStart" datetime NOT NULL,
        "periodEnd" datetime NOT NULL,
        "servicesCount" integer NOT NULL DEFAULT (0),
        "patientsCount" integer NOT NULL DEFAULT (0),
        "studiesCount" integer NOT NULL DEFAULT (0),
        "subtotalAmount" decimal(12,2) NOT NULL DEFAULT (0),
        "discountAmount" decimal(12,2) NOT NULL DEFAULT (0),
        "totalAmount" decimal(12,2) NOT NULL DEFAULT (0),
        "averageTicket" decimal(12,2) NOT NULL DEFAULT (0),
        "branchBreakdown" text NOT NULL DEFAULT ('[]'),
        "topStudies" text NOT NULL DEFAULT ('[]'),
        "hourlyBreakdown" text NOT NULL DEFAULT ('[]'),
        "servicesSnapshot" text NOT NULL DEFAULT ('[]'),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `,
            `
      CREATE TABLE "user_login_logs" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "emailIntent" varchar(100),
        "success" boolean NOT NULL DEFAULT (0),
        "ip" varchar(45),
        "user_agent" varchar(255),
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        "user_id" integer,
        CONSTRAINT "FK_f8379df7d627c940c12d301485a"
          FOREIGN KEY ("user_id") REFERENCES "user" ("id")
          ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `,
        ];
        const createIndexStatements = [
            `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_e12875dfb3b1d92d7d7c5377e2" ON "user" ("email")`,
            `CREATE INDEX IF NOT EXISTS "idx_studies_name" ON "studies" ("name")`,
            `CREATE INDEX IF NOT EXISTS "idx_studies_code" ON "studies" ("code")`,
            `CREATE INDEX IF NOT EXISTS "idx_patients_name" ON "patients" ("firstName")`,
            `CREATE INDEX IF NOT EXISTS "idx_patients_phone" ON "patients" ("phone")`,
            `CREATE INDEX IF NOT EXISTS "idx_patients_email" ON "patients" ("email")`,
            `CREATE INDEX IF NOT EXISTS "idx_doctors_name" ON "doctors" ("firstName")`,
            `CREATE INDEX IF NOT EXISTS "idx_doctors_email" ON "doctors" ("email")`,
            `CREATE INDEX IF NOT EXISTS "idx_doctors_phone" ON "doctors" ("phone")`,
            `CREATE INDEX IF NOT EXISTS "idx_services_folio" ON "service_orders" ("folio")`,
            `CREATE INDEX IF NOT EXISTS "idx_service_order_created_at" ON "service_orders" ("createdAt")`,
            `CREATE INDEX IF NOT EXISTS "idx_service_order_status" ON "service_orders" ("status")`,
            `CREATE INDEX IF NOT EXISTS "idx_service_order_doctor" ON "service_orders" ("doctor_id")`,
            `CREATE INDEX IF NOT EXISTS "idx_service_order_patient" ON "service_orders" ("patient_id")`,
            `CREATE INDEX IF NOT EXISTS "idx_study_results_active" ON "study_results" ("isActive")`,
            `CREATE INDEX IF NOT EXISTS "idx_study_results_service_item" ON "study_results" ("service_order_item_id")`,
            `CREATE INDEX IF NOT EXISTS "idx_study_results_service_order" ON "study_results" ("service_order_id")`,
            `CREATE UNIQUE INDEX IF NOT EXISTS "idx_daily_closings_closing_date" ON "daily_closings" ("closingDate")`,
        ];
        for (const statement of createTableStatements) {
            await queryRunner.query(statement);
        }
        for (const statement of createIndexStatements) {
            await queryRunner.query(statement);
        }
    }
    async down(queryRunner) {
        if ((0, migration_database_util_1.getMigrationDatabaseType)(queryRunner) !== 'sqlite') {
            return;
        }
        await queryRunner.query('PRAGMA foreign_keys = OFF');
        try {
            const dropStatements = [
                `DROP TABLE IF EXISTS "study_result_values"`,
                `DROP TABLE IF EXISTS "study_results"`,
                `DROP TABLE IF EXISTS "service_order_items"`,
                `DROP TABLE IF EXISTS "service_orders"`,
                `DROP TABLE IF EXISTS "study_details"`,
                `DROP TABLE IF EXISTS "studies"`,
                `DROP TABLE IF EXISTS "daily_closings"`,
                `DROP TABLE IF EXISTS "user_session"`,
                `DROP TABLE IF EXISTS "user_login_logs"`,
                `DROP TABLE IF EXISTS "patients"`,
                `DROP TABLE IF EXISTS "doctors"`,
                `DROP TABLE IF EXISTS "user"`,
            ];
            for (const statement of dropStatements) {
                await queryRunner.query(statement);
            }
        }
        finally {
            await queryRunner.query('PRAGMA foreign_keys = ON');
        }
    }
}
exports.CreateSqliteBaselineSchema20260320000100 = CreateSqliteBaselineSchema20260320000100;
//# sourceMappingURL=20260320000100-create-sqlite-baseline-schema.js.map