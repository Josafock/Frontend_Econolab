"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMigrationDatabaseType = getMigrationDatabaseType;
exports.getSqlBooleanLiteral = getSqlBooleanLiteral;
exports.addColumnIfMissing = addColumnIfMissing;
exports.dropColumnIfExists = dropColumnIfExists;
function getMigrationDatabaseType(queryRunner) {
    return queryRunner.connection.options.type === 'sqlite'
        ? 'sqlite'
        : 'postgres';
}
function getSqlBooleanLiteral(databaseType, value) {
    if (databaseType === 'sqlite') {
        return value ? '1' : '0';
    }
    return value ? 'true' : 'false';
}
async function addColumnIfMissing(queryRunner, tableName, columnName, columnDefinitionSql) {
    if (await queryRunner.hasColumn(tableName, columnName)) {
        return;
    }
    await queryRunner.query(`
    ALTER TABLE "${tableName}"
    ADD COLUMN ${columnDefinitionSql}
  `);
}
async function dropColumnIfExists(queryRunner, tableName, columnName) {
    if (!(await queryRunner.hasColumn(tableName, columnName))) {
        return;
    }
    await queryRunner.dropColumn(tableName, columnName);
}
//# sourceMappingURL=migration-database.util.js.map