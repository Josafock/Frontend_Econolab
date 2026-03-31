"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
exports.getDatabaseRuntimeConfig = getDatabaseRuntimeConfig;
exports.buildTypeOrmModuleOptions = buildTypeOrmModuleOptions;
exports.buildTypeOrmDataSourceOptions = buildTypeOrmDataSourceOptions;
const config_1 = require("@nestjs/config");
const node_module_1 = require("node:module");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const env_utils_1 = require("./env.utils");
const runtimeRequire = (0, node_module_1.createRequire)(__filename);
function normalizeDatabaseType(value) {
    return value?.trim().toLowerCase() === 'sqlite' ? 'sqlite' : 'postgres';
}
function resolveSQLitePath(value) {
    return (0, node_path_1.resolve)(process.cwd(), value?.trim() || 'data/econolab.sqlite');
}
function ensureSqliteDriverInstalled() {
    try {
        runtimeRequire.resolve('sqlite3');
    }
    catch {
        throw new Error('DATABASE_TYPE=sqlite requiere el paquete "sqlite3". Instalala antes de activar el modo local.');
    }
}
function getDatabaseRuntimeConfig(env = process.env) {
    const type = normalizeDatabaseType(env.DATABASE_TYPE);
    return {
        type,
        host: (0, env_utils_1.parseOptionalStringEnv)(env.DATABASE_HOST),
        port: (0, env_utils_1.parseNumberEnv)(env.DATABASE_PORT, 5432),
        username: (0, env_utils_1.parseOptionalStringEnv)(env.DATABASE_USER),
        password: (0, env_utils_1.parseOptionalStringEnv)(env.DATABASE_PASS),
        name: (0, env_utils_1.parseOptionalStringEnv)(env.DATABASE_NAME),
        ssl: (0, env_utils_1.parseBooleanEnv)(env.DATABASE_SSL, type === 'postgres'),
        logging: (0, env_utils_1.parseBooleanEnv)(env.DATABASE_LOGGING, true),
        synchronize: (0, env_utils_1.parseBooleanEnv)(env.DATABASE_SYNCHRONIZE, true),
        sqlitePath: resolveSQLitePath(env.DATABASE_SQLITE_PATH),
    };
}
exports.databaseConfig = (0, config_1.registerAs)('database', () => getDatabaseRuntimeConfig());
function buildBaseDatabaseOptions(database) {
    if (database.type === 'sqlite') {
        ensureSqliteDriverInstalled();
        (0, node_fs_1.mkdirSync)((0, node_path_1.dirname)(database.sqlitePath), { recursive: true });
        return {
            type: 'sqlite',
            database: database.sqlitePath,
            logging: database.logging,
        };
    }
    return {
        type: 'postgres',
        host: database.host,
        port: database.port,
        username: database.username,
        password: database.password,
        database: database.name,
        ssl: database.ssl,
        logging: database.logging,
    };
}
function buildTypeOrmModuleOptions(database) {
    return {
        ...buildBaseDatabaseOptions(database),
        autoLoadEntities: true,
        synchronize: database.synchronize,
    };
}
function buildTypeOrmDataSourceOptions(database, entities, migrations) {
    return {
        ...buildBaseDatabaseOptions(database),
        synchronize: false,
        entities,
        migrations,
    };
}
//# sourceMappingURL=database.config.js.map