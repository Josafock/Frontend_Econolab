"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
async function main() {
    process.env.DATABASE_TYPE ??= 'sqlite';
    process.env.APP_RUNTIME_MODE ??= 'desktop-offline';
    process.env.DATABASE_SYNCHRONIZE ??= 'false';
    process.env.DATABASE_LOGGING ??= 'false';
    process.env.JWT_SECRET ??= 'sync-users-offline-secret';
    process.env.DATABASE_SQLITE_PATH ??= (0, node_path_1.resolve)(process.cwd(), 'tmp', 'phase14-sync-users-offline.sqlite');
    (0, node_fs_1.mkdirSync)((0, node_path_1.dirname)(process.env.DATABASE_SQLITE_PATH), { recursive: true });
    (0, node_fs_1.rmSync)(process.env.DATABASE_SQLITE_PATH, { force: true });
    const { default: appDataSource } = await Promise.resolve().then(() => require('../src/database/typeorm.datasource'));
    const { hashPassword } = await Promise.resolve().then(() => require('../src/common/utils/crypto.util'));
    const { Role } = await Promise.resolve().then(() => require('../src/common/enums/roles.enum'));
    const { UsersService } = await Promise.resolve().then(() => require('../src/users/users.service'));
    const { AuthService } = await Promise.resolve().then(() => require('../src/auth/auth.service'));
    const { SyncInboundService } = await Promise.resolve().then(() => require('../src/sync/sync-inbound.service'));
    const { User } = await Promise.resolve().then(() => require('../src/users/entities/user.entity'));
    const { UserSession } = await Promise.resolve().then(() => require('../src/auth/entities/user-session.entity'));
    const { SyncOutboxOperation } = await Promise.resolve().then(() => require('../src/sync/entities/sync-outbox-event.entity'));
    await appDataSource.initialize();
    try {
        await appDataSource.runMigrations();
        const userRepo = appDataSource.getRepository(User);
        const sessionRepo = appDataSource.getRepository(UserSession);
        const syncInbound = new SyncInboundService(appDataSource);
        const password = 'Password123!';
        const passwordHash = await hashPassword(password);
        const publicId = '11111111-1111-1111-1111-111111111111';
        const applyResult = await syncInbound.applyBatch([
            {
                resourceType: 'users',
                operation: SyncOutboxOperation.UPSERT,
                payload: {
                    publicId,
                    syncVersion: 1,
                    syncOrigin: 'server',
                    nombre: 'Recepcion Local',
                    email: 'recepcion.local@econolab.test',
                    password: passwordHash,
                    confirmed: true,
                    rol: Role.Recepcionista,
                    token: null,
                    profileImageData: null,
                    profileImageMimeType: null,
                    googleAvatarUrl: null,
                    resetTokenExpiresAt: null,
                    resetRequestCount: 0,
                    resetRequestWindowStart: null,
                    failedLoginAttempts: 0,
                    lockUntil: null,
                },
            },
        ]);
        const provisionedUser = await userRepo.findOneByOrFail({ publicId });
        const usersService = new UsersService(userRepo, {
            assertDeliveryAvailable() {
                return;
            },
        }, {
            assertHardDeleteAllowed() {
                return;
            },
        }, {
            resolveProfileImageUrl: async () => null,
        });
        const authService = new AuthService(usersService, {
            logSuccess: async () => undefined,
            logFailure: async () => undefined,
        }, {
            getOrThrow() {
                return {
                    runtimeMode: 'desktop-offline',
                };
            },
        }, {
            getStatus() {
                return {
                    remoteBaseUrlConfigured: false,
                };
            },
        }, sessionRepo, userRepo);
        const loginResult = await authService.login({
            email: 'recepcion.local@econolab.test',
            password,
        });
        const createdSessions = await sessionRepo.count();
        const deleteResult = await syncInbound.applyBatch([
            {
                resourceType: 'users',
                operation: SyncOutboxOperation.DELETE,
                payload: {
                    publicId,
                    syncVersion: 2,
                    syncOrigin: 'server',
                },
            },
        ]);
        let loginAfterDelete = 'unexpected-success';
        try {
            await authService.login({
                email: 'recepcion.local@econolab.test',
                password,
            });
        }
        catch (error) {
            loginAfterDelete =
                error instanceof Error ? error.message : 'Error no identificado';
        }
        const userAfterDelete = await userRepo.findOneBy({ publicId });
        if (applyResult.appliedCount !== 1) {
            throw new Error('El usuario provisionado debio aplicarse correctamente.');
        }
        if (loginResult.usuario.email !== 'recepcion.local@econolab.test') {
            throw new Error('El login offline no devolvio el usuario esperado.');
        }
        if (createdSessions !== 1) {
            throw new Error('El login offline debio crear exactamente una sesion local.');
        }
        if (deleteResult.appliedCount !== 1 || userAfterDelete) {
            throw new Error('La eliminacion sincronizada del usuario debio removerlo localmente.');
        }
        if (loginAfterDelete !== 'El e-mail no existe') {
            throw new Error(`El login tras eliminar usuario debio fallar con correo inexistente y fallo con: ${loginAfterDelete}`);
        }
        console.log(JSON.stringify({
            ok: true,
            provisionedUser: {
                publicId: provisionedUser.publicId,
                email: provisionedUser.email,
                role: provisionedUser.rol,
                syncVersion: provisionedUser.syncVersion,
            },
            loginResult: {
                email: loginResult.usuario.email,
                role: loginResult.usuario.rol,
                tokenLength: loginResult.token.length,
            },
            deleteAppliedCount: deleteResult.appliedCount,
            loginAfterDelete,
        }, null, 2));
    }
    finally {
        await appDataSource.destroy();
    }
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=sync-users-offline-smoke.js.map