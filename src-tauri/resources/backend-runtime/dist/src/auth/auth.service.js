"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_util_1 = require("../common/utils/crypto.util");
const roles_enum_1 = require("../common/enums/roles.enum");
const jwt_util_1 = require("../common/utils/jwt.util");
const sync_runner_service_1 = require("../sync/sync-runner.service");
const user_entity_1 = require("../users/entities/user.entity");
const users_service_1 = require("../users/users.service");
const auth_events_service_1 = require("./auth-events.service");
const user_session_entity_1 = require("./entities/user-session.entity");
let AuthService = AuthService_1 = class AuthService {
    users;
    authEvents;
    configService;
    syncRunner;
    sessionsRepo;
    usersRepo;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(users, authEvents, configService, syncRunner, sessionsRepo, usersRepo) {
        this.users = users;
        this.authEvents = authEvents;
        this.configService = configService;
        this.syncRunner = syncRunner;
        this.sessionsRepo = sessionsRepo;
        this.usersRepo = usersRepo;
    }
    get appRuntimeConfig() {
        return this.configService.getOrThrow('app');
    }
    async tryHydrateUsersForDesktopLogin(email) {
        const runtimeMode = this.appRuntimeConfig.runtimeMode;
        if (runtimeMode === 'web-online') {
            return null;
        }
        if (!this.syncRunner.getStatus().remoteBaseUrlConfigured) {
            return null;
        }
        try {
            await this.syncRunner.bootstrapFromRemote({
                resourceTypes: ['users'],
                includeDeleted: true,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`No se pudieron hidratar usuarios remotos para login desktop: ${message}`);
            return {
                user: null,
                hydrationFailed: true,
            };
        }
        return {
            user: await this.users.findByEmail(email),
            hydrationFailed: false,
        };
    }
    async ensureDesktopDataReadyForLogin() {
        const runtimeMode = this.appRuntimeConfig.runtimeMode;
        if (runtimeMode === 'web-online') {
            return;
        }
        if (!this.syncRunner.getStatus().remoteBaseUrlConfigured) {
            return;
        }
        try {
            await this.syncRunner.ensureDesktopDataReady();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`No se pudo preparar la data inicial para login desktop: ${message}`);
            throw new common_1.ServiceUnavailableException('No fue posible preparar los catalogos iniciales del escritorio. Verifica la conexion con el servidor central e intentalo de nuevo.');
        }
    }
    async registerFailedLogin(user) {
        const MAX_ATTEMPTS = 3;
        const LOCK_MINUTES = 15;
        const now = new Date();
        user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1;
        if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
            user.lockUntil = new Date(now.getTime() + LOCK_MINUTES * 60 * 1000);
        }
        await this.usersRepo.save(user);
    }
    async resetLoginAttempts(user) {
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await this.usersRepo.save(user);
    }
    getSessionExpiresAt() {
        const SESSION_DAYS = 30;
        return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    }
    async createAuthenticatedResponse(user, ip, userAgent, message) {
        const session = await this.sessionsRepo.save(this.sessionsRepo.create({
            user,
            expiresAt: this.getSessionExpiresAt(),
            ip: ip ?? null,
            userAgent: userAgent ?? null,
        }));
        const payload = {
            sub: user.id,
            rol: user.rol,
            nombre: user.nombre,
            email: user.email,
            jti: session.id,
        };
        await this.authEvents.logSuccess(user, ip, userAgent);
        return {
            message,
            token: (0, jwt_util_1.generateJWT)(payload),
            usuario: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
            },
        };
    }
    async login(dto, ip, userAgent) {
        let user = await this.users.findByEmail(dto.email);
        let hydrationFailed = false;
        if (!user) {
            const hydrated = await this.tryHydrateUsersForDesktopLogin(dto.email);
            if (hydrated) {
                user = hydrated.user;
                hydrationFailed = hydrated.hydrationFailed;
            }
        }
        if (!user) {
            await this.authEvents.logFailure(dto.email, ip, userAgent);
            if (hydrationFailed) {
                throw new common_1.ServiceUnavailableException('No fue posible sincronizar usuarios con el servidor central en este momento.');
            }
            throw new common_1.NotFoundException('El e-mail no existe');
        }
        if (user.lockUntil && user.lockUntil > new Date()) {
            await this.authEvents.logFailure(dto.email, ip, userAgent);
            throw new common_1.ForbiddenException('La cuenta está bloqueada temporalmente por intentos fallidos. Inténtalo más tarde.');
        }
        if (!user.confirmed) {
            await this.authEvents.logFailure(dto.email, ip, userAgent);
            throw new common_1.ForbiddenException('Cuenta no confirmada');
        }
        const ok = await (0, crypto_util_1.checkPassword)(dto.password, user.password);
        if (!ok) {
            await this.registerFailedLogin(user);
            await this.authEvents.logFailure(dto.email, ip, userAgent);
            if (user.lockUntil && user.lockUntil > new Date()) {
                throw new common_1.ForbiddenException('La cuenta se ha bloqueado temporalmente por intentos fallidos.');
            }
            throw new common_1.UnauthorizedException('Contraseña incorrecta');
        }
        if (user.rol === roles_enum_1.Role.Unassigned) {
            await this.authEvents.logFailure(dto.email, ip, userAgent);
            throw new common_1.ForbiddenException('Rol pendiente de asignación');
        }
        await this.resetLoginAttempts(user);
        await this.ensureDesktopDataReadyForLogin();
        return this.createAuthenticatedResponse(user, ip, userAgent, 'Autenticado...');
    }
    async loginWithOAuthUser(user, ip, userAgent) {
        if (!user.confirmed) {
            throw new common_1.ForbiddenException('Cuenta no confirmada');
        }
        if (user.rol === roles_enum_1.Role.Unassigned) {
            throw new common_1.ForbiddenException('Rol pendiente de asignación');
        }
        return this.createAuthenticatedResponse(user, ip, userAgent, 'Autenticado con proveedor externo...');
    }
    async logout(jti) {
        const session = await this.sessionsRepo.findOne({ where: { id: jti } });
        if (!session) {
            return;
        }
        session.revoked = true;
        await this.sessionsRepo.save(session);
    }
    async logoutAll(userId) {
        await this.sessionsRepo.update({ user: { id: userId }, revoked: false }, { revoked: true });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, typeorm_1.InjectRepository)(user_session_entity_1.UserSession)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        auth_events_service_1.AuthEventsService,
        config_1.ConfigService,
        sync_runner_service_1.SyncRunnerService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map