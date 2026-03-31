"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPortableTimestampColumnOptions = getPortableTimestampColumnOptions;
exports.getPortableCreateDateColumnOptions = getPortableCreateDateColumnOptions;
exports.getPortableUpdateDateColumnOptions = getPortableUpdateDateColumnOptions;
exports.getPortableEnumColumnOptions = getPortableEnumColumnOptions;
exports.getPortableJsonColumnOptions = getPortableJsonColumnOptions;
exports.getPortableIntegerArrayColumnOptions = getPortableIntegerArrayColumnOptions;
exports.getPortableGeneratedPrimaryColumnOptions = getPortableGeneratedPrimaryColumnOptions;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const dotenv_1 = require("dotenv");
const database_config_1 = require("../config/database.config");
let resolvedDatabaseType = null;
function ensureDatabaseEnvLoaded() {
    if (resolvedDatabaseType) {
        return;
    }
    const candidates = [
        (0, node_path_1.resolve)(__dirname, '..', '..', '.env'),
        (0, node_path_1.resolve)(process.cwd(), '.env'),
        (0, node_path_1.resolve)(process.cwd(), 'backend', '.env'),
    ];
    for (const candidate of new Set(candidates)) {
        if (!(0, node_fs_1.existsSync)(candidate)) {
            continue;
        }
        (0, dotenv_1.config)({ path: candidate, override: false });
        break;
    }
}
function getResolvedDatabaseType() {
    if (!resolvedDatabaseType) {
        ensureDatabaseEnvLoaded();
        resolvedDatabaseType = (0, database_config_1.getDatabaseRuntimeConfig)().type;
    }
    return resolvedDatabaseType;
}
function isSqliteRuntime() {
    return getResolvedDatabaseType() === 'sqlite';
}
function getPortableTimestampType(mode) {
    if (isSqliteRuntime()) {
        return 'datetime';
    }
    return mode;
}
function getPortableTimestampColumnOptions(options = {}, mode = 'timestamptz') {
    return {
        ...options,
        type: getPortableTimestampType(mode),
    };
}
function getPortableCreateDateColumnOptions(options = {}, mode = 'timestamptz') {
    return {
        ...options,
        type: getPortableTimestampType(mode),
    };
}
function getPortableUpdateDateColumnOptions(options = {}, mode = 'timestamptz') {
    return {
        ...options,
        type: getPortableTimestampType(mode),
    };
}
function getPortableEnumColumnOptions(enumValues, defaultValue, options = {}) {
    return {
        ...options,
        type: isSqliteRuntime() ? 'simple-enum' : 'enum',
        enum: enumValues,
        ...(defaultValue === undefined ? {} : { default: defaultValue }),
    };
}
function getPortableJsonColumnOptions(defaultValue = '[]', options = {}) {
    if (isSqliteRuntime()) {
        return {
            ...options,
            type: 'simple-json',
            default: defaultValue,
        };
    }
    const escapedDefault = defaultValue.replace(/'/g, "''");
    return {
        ...options,
        type: 'jsonb',
        default: () => `'${escapedDefault}'`,
    };
}
function getPortableIntegerArrayColumnOptions(options = {}) {
    if (isSqliteRuntime()) {
        return {
            ...options,
            type: 'simple-json',
            default: '[]',
        };
    }
    return {
        ...options,
        type: 'int',
        array: true,
        default: () => 'ARRAY[]::INTEGER[]',
    };
}
function getPortableGeneratedPrimaryColumnOptions(preferBigInt = false) {
    if (isSqliteRuntime()) {
        return { type: 'integer' };
    }
    if (preferBigInt) {
        return { type: 'bigint' };
    }
    return { type: 'int' };
}
//# sourceMappingURL=portable-column-options.js.map