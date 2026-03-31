import { ConfigService } from '@nestjs/config';
import { type SupportedDatabaseType } from '../config/database.config';
export declare class DatabaseDialectService {
    private readonly configService;
    constructor(configService: ConfigService);
    get type(): SupportedDatabaseType;
    buildCompactSearchExpression(expression: string): string;
    buildDigitsOnlyExpression(expression: string): string;
    buildLowerTrimExpression(expression: string): string;
    getLocalDateExpression(timeZone: string, expression: string): string;
    getDateTokenExpression(timeZone: string, expression: string): string;
}
