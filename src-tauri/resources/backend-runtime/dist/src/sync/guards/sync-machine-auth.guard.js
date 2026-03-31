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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncMachineAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const node_crypto_1 = require("node:crypto");
const roles_enum_1 = require("../../common/enums/roles.enum");
let SyncMachineAuthGuard = class SyncMachineAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
    configService;
    constructor(configService) {
        super();
        this.configService = configService;
    }
    get runtimeConfig() {
        return this.configService.getOrThrow('sync');
    }
    extractSyncToken(request) {
        const headerName = this.runtimeConfig.machineHeaderName;
        const directHeaderValue = request.header(headerName)?.trim();
        if (directHeaderValue) {
            return directHeaderValue;
        }
        const authorization = request.header('authorization')?.trim();
        if (!authorization) {
            return null;
        }
        const match = authorization.match(/^sync\s+(.+)$/i);
        return match?.[1]?.trim() || null;
    }
    safeTokenEquals(provided, expected) {
        const providedBuffer = Buffer.from(provided);
        const expectedBuffer = Buffer.from(expected);
        if (providedBuffer.length !== expectedBuffer.length) {
            return false;
        }
        return (0, node_crypto_1.timingSafeEqual)(providedBuffer, expectedBuffer);
    }
    createMachineUser() {
        return {
            id: 'sync-machine',
            email: 'sync-machine@econolab.local',
            rol: roles_enum_1.Role.Admin,
            jti: 'sync-machine',
            authType: 'sync-machine',
        };
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const syncToken = this.extractSyncToken(request);
        if (syncToken) {
            if (!this.runtimeConfig.machineAuthEnabled) {
                throw new common_1.UnauthorizedException('La autenticacion de sync por token esta deshabilitada.');
            }
            const expectedToken = this.runtimeConfig.machineToken?.trim();
            if (!expectedToken) {
                throw new common_1.UnauthorizedException('La autenticacion de sync por token no esta configurada correctamente.');
            }
            if (!this.safeTokenEquals(syncToken, expectedToken)) {
                throw new common_1.UnauthorizedException('Token de sync no valido');
            }
            request.user = this.createMachineUser();
            return true;
        }
        const authenticated = (await super.canActivate(context));
        const authenticatedUser = request.user;
        if (!authenticatedUser?.rol) {
            throw new common_1.UnauthorizedException('Token no valido o inexistente');
        }
        if (authenticatedUser.rol !== roles_enum_1.Role.Admin) {
            throw new common_1.ForbiddenException('Solo un administrador o un cliente de sync autorizado puede operar sync.');
        }
        return authenticated;
    }
    handleRequest(err, user, info, context, status) {
        void context;
        void status;
        if (err || !user) {
            const infoName = info instanceof Error ? info.name : info?.name;
            if (infoName === 'TokenExpiredError') {
                throw new common_1.UnauthorizedException('El token ha expirado, inicie sesion nuevamente');
            }
            throw new common_1.UnauthorizedException('Token no valido o inexistente');
        }
        return user;
    }
};
exports.SyncMachineAuthGuard = SyncMachineAuthGuard;
exports.SyncMachineAuthGuard = SyncMachineAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SyncMachineAuthGuard);
//# sourceMappingURL=sync-machine-auth.guard.js.map