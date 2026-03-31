import type { INestApplication } from '@nestjs/common';
import type { NestApplicationOptions } from '@nestjs/common/interfaces/nest-application-options.interface';
export declare function createConfiguredApp(options?: NestApplicationOptions): Promise<{
    app: INestApplication<any>;
    runtimeConfig: {
        runtimeMode: import("./config/app.config").AppRuntimeMode;
        globalPrefix: string;
        port: number;
        host: string | undefined;
        helmetEnabled: boolean;
        corsEnabled: boolean;
        allowHardDelete: boolean;
        corsOrigins: string[];
    };
}>;
export declare function bootstrap(): Promise<INestApplication<any>>;
