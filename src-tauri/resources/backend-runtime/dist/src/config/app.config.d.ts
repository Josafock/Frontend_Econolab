export type AppRuntimeMode = 'web-online' | 'desktop-online' | 'desktop-offline';
export declare function getAppRuntimeConfig(env?: NodeJS.ProcessEnv): {
    runtimeMode: AppRuntimeMode;
    globalPrefix: string;
    port: number;
    host: string | undefined;
    helmetEnabled: boolean;
    corsEnabled: boolean;
    allowHardDelete: boolean;
    corsOrigins: string[];
};
export type AppRuntimeConfig = ReturnType<typeof getAppRuntimeConfig>;
export declare const appConfig: (() => {
    runtimeMode: AppRuntimeMode;
    globalPrefix: string;
    port: number;
    host: string | undefined;
    helmetEnabled: boolean;
    corsEnabled: boolean;
    allowHardDelete: boolean;
    corsOrigins: string[];
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    runtimeMode: AppRuntimeMode;
    globalPrefix: string;
    port: number;
    host: string | undefined;
    helmetEnabled: boolean;
    corsEnabled: boolean;
    allowHardDelete: boolean;
    corsOrigins: string[];
}>;
