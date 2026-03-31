"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
const roles_enum_1 = require("../src/common/enums/roles.enum");
const sync_config_1 = require("../src/config/sync.config");
const sync_machine_auth_guard_1 = require("../src/sync/guards/sync-machine-auth.guard");
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
function createMockRequest(headers) {
    const normalizedHeaders = Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
    return {
        headers: normalizedHeaders,
        user: undefined,
        header(name) {
            return normalizedHeaders[name.toLowerCase()];
        },
    };
}
function createExecutionContext(request) {
    return {
        switchToHttp: () => ({
            getRequest: () => request,
        }),
    };
}
async function expectUnauthorized(guard, headers) {
    const request = createMockRequest(headers);
    try {
        await guard.canActivate(createExecutionContext(request));
    }
    catch (error) {
        assert(error instanceof Error &&
            'status' in error &&
            error.status === 401, 'Se esperaba UnauthorizedException para token de sync invalido.');
        return;
    }
    throw new Error('Se esperaba rechazo para token de sync invalido.');
}
async function main() {
    const env = {
        ...process.env,
        SYNC_MACHINE_TOKEN: 'super-sync-secret',
        SYNC_MACHINE_AUTH_ENABLED: 'true',
        SYNC_MACHINE_HEADER: 'x-sync-token',
    };
    const configService = new config_1.ConfigService({
        sync: (0, sync_config_1.getSyncRuntimeConfig)(env),
    });
    const guard = new sync_machine_auth_guard_1.SyncMachineAuthGuard(configService);
    const headerRequest = createMockRequest({
        'x-sync-token': 'super-sync-secret',
    });
    const headerAllowed = await guard.canActivate(createExecutionContext(headerRequest));
    assert(headerAllowed === true, 'El header de sync valido debio autenticar.');
    assert(headerRequest.user?.rol === roles_enum_1.Role.Admin, 'El cliente de sync debe mapearse como admin tecnico.');
    const authorizationRequest = createMockRequest({
        authorization: 'Sync super-sync-secret',
    });
    const authorizationAllowed = await guard.canActivate(createExecutionContext(authorizationRequest));
    assert(authorizationAllowed === true, 'Authorization: Sync <token> debio autenticar.');
    await expectUnauthorized(guard, {
        'x-sync-token': 'otro-token',
    });
    console.log(JSON.stringify({
        ok: true,
        headerAuth: true,
        authorizationAuth: true,
        principalRole: headerRequest.user.rol ?? null,
    }, null, 2));
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=sync-machine-auth-smoke.js.map