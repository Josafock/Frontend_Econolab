"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
exports.getAppRuntimeConfig = getAppRuntimeConfig;
const config_1 = require("@nestjs/config");
const env_utils_1 = require("./env.utils");
const DEFAULT_CORS_ORIGINS = [
    'https://econolabe.netlify.app',
    'http://localhost:5173',
];
function normalizeRuntimeMode(value) {
    switch (value?.trim().toLowerCase()) {
        case 'desktop-online':
            return 'desktop-online';
        case 'desktop-offline':
            return 'desktop-offline';
        case 'web-online':
        default:
            return 'web-online';
    }
}
function getAppRuntimeConfig(env = process.env) {
    const runtimeMode = normalizeRuntimeMode(env.APP_RUNTIME_MODE);
    return {
        runtimeMode,
        globalPrefix: env.APP_GLOBAL_PREFIX?.trim() || 'api',
        port: (0, env_utils_1.parseNumberEnv)(env.PORT, 3000),
        host: (0, env_utils_1.parseOptionalStringEnv)(env.HOST),
        helmetEnabled: (0, env_utils_1.parseBooleanEnv)(env.APP_HELMET_ENABLED, true),
        corsEnabled: (0, env_utils_1.parseBooleanEnv)(env.APP_CORS_ENABLED, true),
        allowHardDelete: (0, env_utils_1.parseBooleanEnv)(env.APP_ALLOW_HARD_DELETE, runtimeMode === 'web-online'),
        corsOrigins: (0, env_utils_1.parseStringListEnv)(env.APP_CORS_ORIGINS, DEFAULT_CORS_ORIGINS),
    };
}
exports.appConfig = (0, config_1.registerAs)('app', () => getAppRuntimeConfig());
//# sourceMappingURL=app.config.js.map