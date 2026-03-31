import { QueryRunner } from 'typeorm';
import type { SupportedDatabaseType } from '../config/database.config';
export declare function getMigrationDatabaseType(queryRunner: QueryRunner): SupportedDatabaseType;
export declare function getSqlBooleanLiteral(databaseType: SupportedDatabaseType, value: boolean): "1" | "true" | "0" | "false";
export declare function addColumnIfMissing(queryRunner: QueryRunner, tableName: string, columnName: string, columnDefinitionSql: string): Promise<void>;
export declare function dropColumnIfExists(queryRunner: QueryRunner, tableName: string, columnName: string): Promise<void>;
