import type { SupportedDatabaseType } from '../../config/database.config';
export declare function getLabDateInput(timeZone: string, value?: Date): string;
export declare function getLabDateToken(timeZone: string, value?: Date): string;
export declare function getMonthKey(timeZone: string, value?: Date): string;
export declare function getLocalDateExpression(timeZone: string, expression: string, databaseType?: SupportedDatabaseType): string;
export declare function getLocalDateTokenExpression(timeZone: string, expression: string, databaseType?: SupportedDatabaseType): string;
