"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncConfig = void 0;
exports.getSyncRuntimeConfig = getSyncRuntimeConfig;
const config_1 = require("@nestjs/config");
const app_config_1 = require("./app.config");
const env_utils_1 = require("./env.utils");
function getDefaultOriginForRuntime(runtimeMode) {
    switch (runtimeMode) {
        case 'desktop-online':
            return 'desktop-online';
        case 'desktop-offline':
            return 'desktop-offline';
        case 'web-online':
        default:
            return 'server';
    }
}
function normalizeMachineHeaderName(value) {
    return value?.trim().toLowerCase() || 'x-sync-token';
}
function normalizeRemoteBaseUrl(value) {
    const normalized = (0, env_utils_1.parseOptionalStringEnv)(value);
    return normalized?.replace(/\/+$/, '') || undefined;
}
function getSyncRuntimeConfig(env = process.env) {
    const { runtimeMode } = (0, app_config_1.getAppRuntimeConfig)(env);
    const machineToken = (0, env_utils_1.parseOptionalStringEnv)(env.SYNC_MACHINE_TOKEN);
    const remoteBaseUrl = normalizeRemoteBaseUrl(env.SYNC_REMOTE_BASE_URL);
    return {
        outboxEnabled: (0, env_utils_1.parseBooleanEnv)(env.SYNC_OUTBOX_ENABLED, runtimeMode !== 'web-online'),
        defaultOrigin: (0, env_utils_1.parseOptionalStringEnv)(env.SYNC_DEFAULT_ORIGIN) ??
            getDefaultOriginForRuntime(runtimeMode),
        outboxBatchSize: (0, env_utils_1.parseNumberEnv)(env.SYNC_OUTBOX_BATCH_SIZE, 100),
        retryDelaySeconds: (0, env_utils_1.parseNumberEnv)(env.SYNC_RETRY_DELAY_SECONDS, 30),
        machineAuthEnabled: (0, env_utils_1.parseBooleanEnv)(env.SYNC_MACHINE_AUTH_ENABLED, Boolean(machineToken)),
        machineHeaderName: normalizeMachineHeaderName(env.SYNC_MACHINE_HEADER),
        machineToken,
        remoteBaseUrl,
        remoteTimeoutMs: (0, env_utils_1.parseNumberEnv)(env.SYNC_REMOTE_TIMEOUT_MS, 15000),
        autoEnabled: (0, env_utils_1.parseBooleanEnv)(env.SYNC_AUTO_ENABLED, runtimeMode !== 'web-online' && Boolean(remoteBaseUrl)),
        autoIntervalSeconds: (0, env_utils_1.parseNumberEnv)(env.SYNC_AUTO_INTERVAL_SECONDS, 30),
        bootstrapBatchSize: (0, env_utils_1.parseNumberEnv)(env.SYNC_BOOTSTRAP_BATCH_SIZE, 250),
    };
}
exports.syncConfig = (0, config_1.registerAs)('sync', () => getSyncRuntimeConfig());
//# sourceMappingURL=sync.config.js.map