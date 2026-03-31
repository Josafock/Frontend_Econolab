"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = require("node:path");
const app_config_1 = require("../src/config/app.config");
const database_config_1 = require("../src/config/database.config");
const integrations_config_1 = require("../src/config/integrations.config");
const storage_config_1 = require("../src/config/storage.config");
const sync_config_1 = require("../src/config/sync.config");
const runtime_diagnostics_util_1 = require("../src/runtime/runtime-diagnostics.util");
function createEnv(overrides) {
    return {
        ...process.env,
        DATABASE_SQLITE_PATH: overrides.DATABASE_SQLITE_PATH ??
            (0, node_path_1.resolve)(process.cwd(), 'tmp', `${overrides.APP_RUNTIME_MODE ?? 'web'}.sqlite`),
        DATABASE_SYNCHRONIZE: overrides.DATABASE_SYNCHRONIZE ?? 'false',
        DATABASE_LOGGING: overrides.DATABASE_LOGGING ?? 'false',
        ...overrides,
    };
}
function getDiagnosticsForEnv(env) {
    const app = (0, app_config_1.getAppRuntimeConfig)(env);
    const database = (0, database_config_1.getDatabaseRuntimeConfig)(env);
    const integrations = (0, integrations_config_1.getIntegrationRuntimeConfig)(env);
    const storage = (0, storage_config_1.getStorageRuntimeConfig)(env);
    const sync = (0, sync_config_1.getSyncRuntimeConfig)(env);
    return (0, runtime_diagnostics_util_1.buildRuntimeDiagnostics)({
        app,
        database,
        integrations,
        storage,
        sync,
        frontendUrlConfigured: Boolean(env.FRONTEND_URL?.trim()),
        mailConfigured: Boolean(env.GMAIL_USER?.trim() && env.GMAIL_PASS?.trim()),
        googleAuthConfigured: Boolean(env.GOOGLE_CLIENT_ID?.trim() &&
            env.GOOGLE_CLIENT_SECRET?.trim() &&
            env.GOOGLE_CALLBACK_URL?.trim()),
        gmailOauthConfigured: Boolean(env.GOOGLE_CLIENT_ID?.trim() &&
            env.GOOGLE_CLIENT_SECRET?.trim() &&
            env.GOOGLE_REDIRECT_URI?.trim()),
    });
}
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
async function main() {
    const webOnlineEnv = createEnv({
        APP_RUNTIME_MODE: 'web-online',
        DATABASE_TYPE: 'postgres',
        DATABASE_HOST: 'localhost',
        DATABASE_NAME: 'econolab',
        DATABASE_USER: 'postgres',
        DATABASE_PASS: 'postgres',
        FRONTEND_URL: 'http://localhost:5173',
        GMAIL_USER: 'mail@example.com',
        GMAIL_PASS: 'secret',
        GOOGLE_CLIENT_ID: 'client-id',
        GOOGLE_CLIENT_SECRET: 'client-secret',
        GOOGLE_CALLBACK_URL: 'http://localhost:3000/api/auth/google/callback',
        GOOGLE_REDIRECT_URI: 'http://localhost:3000/api/auth/gmail/callback',
        SYNC_MACHINE_TOKEN: 'web-sync-secret',
    });
    const webOnline = getDiagnosticsForEnv(webOnlineEnv);
    assert(webOnline.status === 'ready', 'web-online sano debio quedar ready.');
    assert(webOnline.sync.outboxEnabled === false, 'web-online debe dejar outbox desactivado por default.');
    assert(webOnline.storage.profileImageStorageMode === 'database', 'web-online debe seguir usando imagen de perfil en DB por compatibilidad.');
    const desktopOnlineEnv = createEnv({
        APP_RUNTIME_MODE: 'desktop-online',
        DATABASE_TYPE: 'sqlite',
        FRONTEND_URL: 'http://localhost:5173',
        SYNC_REMOTE_BASE_URL: 'https://central.econolab.test/api',
        GMAIL_USER: 'mail@example.com',
        GMAIL_PASS: 'secret',
        GOOGLE_CLIENT_ID: 'client-id',
        GOOGLE_CLIENT_SECRET: 'client-secret',
        GOOGLE_CALLBACK_URL: 'http://localhost:3000/api/auth/google/callback',
        GOOGLE_REDIRECT_URI: 'http://localhost:3000/api/auth/gmail/callback',
        SYNC_MACHINE_TOKEN: 'desktop-online-secret',
    });
    const desktopOnline = getDiagnosticsForEnv(desktopOnlineEnv);
    assert(desktopOnline.status === 'ready', 'desktop-online sano debio quedar ready.');
    assert(desktopOnline.sync.outboxEnabled === true, 'desktop-online debe dejar outbox activado por default.');
    assert(desktopOnline.storage.profileImageStorageMode === 'filesystem', 'desktop-online debe preferir filesystem para imagenes de perfil.');
    const desktopOfflineEnv = createEnv({
        APP_RUNTIME_MODE: 'desktop-offline',
        DATABASE_TYPE: 'sqlite',
        SYNC_REMOTE_BASE_URL: 'https://central.econolab.test/api',
        SYNC_MACHINE_TOKEN: 'desktop-offline-secret',
    });
    const desktopOffline = getDiagnosticsForEnv(desktopOfflineEnv);
    assert(desktopOffline.status === 'ready', 'desktop-offline sano debio quedar ready.');
    assert(desktopOffline.integrations.mailEnabled === false &&
        desktopOffline.integrations.googleAuthEnabled === false &&
        desktopOffline.integrations.gmailOauthEnabled === false, 'desktop-offline debe desactivar integraciones online por default.');
    assert(desktopOffline.sync.outboxEnabled === true, 'desktop-offline debe dejar outbox activado por default.');
    const riskyDesktopOfflineEnv = createEnv({
        APP_RUNTIME_MODE: 'desktop-offline',
        DATABASE_TYPE: 'postgres',
        APP_ALLOW_HARD_DELETE: 'true',
        APP_MAIL_ENABLED: 'true',
        APP_GOOGLE_AUTH_ENABLED: 'true',
        APP_GMAIL_OAUTH_ENABLED: 'true',
        APP_PROFILE_IMAGE_STORAGE_MODE: 'database',
        SYNC_OUTBOX_ENABLED: 'false',
        DATABASE_SYNCHRONIZE: 'true',
        DATABASE_LOGGING: 'true',
    });
    const riskyDesktopOffline = getDiagnosticsForEnv(riskyDesktopOfflineEnv);
    assert(riskyDesktopOffline.status === 'blocked', 'desktop-offline riesgoso debio quedar blocked.');
    const riskyIssueCodes = new Set(riskyDesktopOffline.issues.map((issue) => issue.code));
    for (const requiredCode of [
        'desktop-offline-remote-db',
        'desktop-runtime-postgres',
        'hard-delete-enabled-on-desktop',
        'desktop-offline-outbox-disabled',
        'offline-online-integrations-enabled',
        'desktop-profile-image-in-db',
        'database-synchronize-enabled',
        'database-logging-enabled',
    ]) {
        assert(riskyIssueCodes.has(requiredCode), `Falto el warning esperado ${requiredCode} en desktop-offline riesgoso.`);
    }
    const scenarios = [
        {
            name: 'web-online-ready',
            status: webOnline.status,
            issues: webOnline.issues.map((issue) => issue.code),
        },
        {
            name: 'desktop-online-ready',
            status: desktopOnline.status,
            issues: desktopOnline.issues.map((issue) => issue.code),
        },
        {
            name: 'desktop-offline-ready',
            status: desktopOffline.status,
            issues: desktopOffline.issues.map((issue) => issue.code),
        },
        {
            name: 'desktop-offline-risky',
            status: riskyDesktopOffline.status,
            issues: riskyDesktopOffline.issues.map((issue) => issue.code),
        },
    ];
    console.log(JSON.stringify({
        ok: true,
        scenarios,
    }, null, 2));
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=runtime-modes-smoke.js.map