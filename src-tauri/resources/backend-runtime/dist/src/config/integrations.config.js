"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationsConfig = void 0;
exports.getIntegrationRuntimeConfig = getIntegrationRuntimeConfig;
const config_1 = require("@nestjs/config");
const app_config_1 = require("./app.config");
const env_utils_1 = require("./env.utils");
function getIntegrationRuntimeConfig(env = process.env) {
    const { runtimeMode } = (0, app_config_1.getAppRuntimeConfig)(env);
    return {
        mailEnabled: (0, env_utils_1.parseBooleanEnv)(env.APP_MAIL_ENABLED, runtimeMode !== 'desktop-offline'),
        googleAuthEnabled: (0, env_utils_1.parseBooleanEnv)(env.APP_GOOGLE_AUTH_ENABLED, runtimeMode !== 'desktop-offline'),
        gmailOauthEnabled: (0, env_utils_1.parseBooleanEnv)(env.APP_GMAIL_OAUTH_ENABLED, runtimeMode === 'web-online'),
    };
}
exports.integrationsConfig = (0, config_1.registerAs)('integrations', () => getIntegrationRuntimeConfig());
//# sourceMappingURL=integrations.config.js.map