import type { SupportedDatabaseType } from '../../config/database.config';
export declare function normalizeCompactSearchText(value?: string | null): string;
export declare function buildCompactSearchSqlExpression(expression: string, databaseType?: SupportedDatabaseType): string;
export declare function buildDigitsOnlySqlExpression(expression: string, databaseType?: SupportedDatabaseType): string;
export declare function buildLowerTrimSqlExpression(expression: string, databaseType?: SupportedDatabaseType): string;
