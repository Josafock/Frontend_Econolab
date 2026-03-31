import type { AppRuntimeConfig } from '../config/app.config';
import type { DatabaseRuntimeConfig } from '../config/database.config';
import type { IntegrationRuntimeConfig } from '../config/integrations.config';
import type { StorageRuntimeConfig } from '../config/storage.config';
import type { SyncRuntimeConfig } from '../config/sync.config';
export type RuntimeDiagnosticSeverity = 'error' | 'warning';
export type RuntimeDiagnosticIssue = {
    code: string;
    severity: RuntimeDiagnosticSeverity;
    message: string;
};
type RuntimeDiagnosticsInput = {
    app: AppRuntimeConfig;
    database: DatabaseRuntimeConfig;
    integrations: IntegrationRuntimeConfig;
    storage: StorageRuntimeConfig;
    sync: SyncRuntimeConfig;
    frontendUrlConfigured: boolean;
    mailConfigured: boolean;
    googleAuthConfigured: boolean;
    gmailOauthConfigured: boolean;
};
export declare function buildRuntimeDiagnostics(input: RuntimeDiagnosticsInput): {
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
    issues: RuntimeDiagnosticIssue[];
};
export {};
