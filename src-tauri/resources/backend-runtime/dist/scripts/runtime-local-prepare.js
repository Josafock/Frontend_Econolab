"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
async function main() {
    process.env.DATABASE_TYPE = process.env.DATABASE_TYPE || 'sqlite';
    process.env.DATABASE_SQLITE_PATH =
        process.env.DATABASE_SQLITE_PATH || 'data/econolab-local.sqlite';
    process.env.DATABASE_LOGGING = process.env.DATABASE_LOGGING || 'false';
    process.env.DATABASE_SYNCHRONIZE = process.env.DATABASE_SYNCHRONIZE || 'false';
    const sqlitePath = (0, node_path_1.resolve)(process.cwd(), process.env.DATABASE_SQLITE_PATH);
    (0, node_fs_1.mkdirSync)((0, node_path_1.dirname)(sqlitePath), { recursive: true });
    const [{ DataSource }, { migrationDataSourceOptions }] = await Promise.all([
        Promise.resolve().then(() => require('typeorm')),
        Promise.resolve().then(() => require('../src/database/typeorm.datasource')),
    ]);
    const migrationDataSource = new DataSource(migrationDataSourceOptions);
    try {
        await migrationDataSource.initialize();
        const executedMigrations = await migrationDataSource.runMigrations();
        const hasPendingMigrations = await migrationDataSource.showMigrations();
        console.log(JSON.stringify({
            ok: true,
            databaseType: process.env.DATABASE_TYPE,
            sqlitePath,
            executedMigrations: executedMigrations.length,
            hasPendingMigrations,
        }, null, 2));
    }
    finally {
        if (migrationDataSource.isInitialized) {
            await migrationDataSource.destroy();
        }
    }
}
main().catch((error) => {
    console.error(error?.stack || String(error));
    process.exit(1);
});
//# sourceMappingURL=runtime-local-prepare.js.map