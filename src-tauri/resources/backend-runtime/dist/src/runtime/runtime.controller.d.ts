import { RuntimeDiagnosticsService } from './runtime-diagnostics.service';
export declare class RuntimeController {
    private readonly runtimeDiagnostics;
    constructor(runtimeDiagnostics: RuntimeDiagnosticsService);
    getDiagnostics(): {
        generatedAt: string;
        process: {
            pid: number;
            nodeVersion: string;
            platform: NodeJS.Platform;
            uptimeSeconds: number;
            memoryRssMb: number;
            memoryHeapUsedMb: number;
            memoryExternalMb: number;
        };
        host: {
            cpuCount: number;
            totalMemoryMb: number;
            freeMemoryMb: number;
        };
        status: string;
        counts: {
            errors: number;
            warnings: number;
        };
        app: {
            runtimeMode: import("../config/app.config").AppRuntimeMode;
            globalPrefix: string;
            corsEnabled: boolean;
            helmetEnabled: boolean;
            allowHardDelete: boolean;
        };
        database: {
            type: import("../config/database.config").SupportedDatabaseType;
            synchronize: boolean;
            logging: boolean;
            sqlitePath: string | null;
        };
        integrations: {
            mailEnabled: boolean;
            mailConfigured: boolean;
            googleAuthEnabled: boolean;
            googleAuthConfigured: boolean;
            gmailOauthEnabled: boolean;
            gmailOauthConfigured: boolean;
            frontendUrlConfigured: boolean;
        };
        storage: {
            rootPath: string;
            profileImageStorageMode: import("../config/storage.config").ProfileImageStorageMode;
            documentOutputMode: import("../config/storage.config").DocumentOutputMode;
        };
        sync: {
            outboxEnabled: boolean;
            defaultOrigin: string;
            outboxBatchSize: number;
            retryDelaySeconds: number;
            remoteBaseUrlConfigured: boolean;
            autoEnabled: boolean;
            autoIntervalSeconds: number;
            bootstrapBatchSize: number;
            machineAuthEnabled: boolean;
            machineHeaderName: string;
            machineTokenConfigured: boolean;
        };
        issues: import("./runtime-diagnostics.util").RuntimeDiagnosticIssue[];
    };
}
