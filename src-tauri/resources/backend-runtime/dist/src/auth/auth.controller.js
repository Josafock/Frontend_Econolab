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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const google_auth_availability_guard_1 = require("./guards/google-auth-availability.guard");
const integration_policy_service_1 = require("../runtime/integration-policy.service");
let AuthController = class AuthController {
    auth;
    config;
    integrationPolicy;
    constructor(auth, config, integrationPolicy) {
        this.auth = auth;
        this.config = config;
        this.integrationPolicy = integrationPolicy;
    }
    login(req, dto) {
        const ua = req.get('user-agent') ?? undefined;
        const ip = req.ip || undefined;
        return this.auth.login(dto, ip, ua);
    }
    googleLogin(res) {
        this.integrationPolicy.assertGoogleAuthEnabled('El inicio de sesion con Google');
        const clientId = this.config.get('GOOGLE_CLIENT_ID');
        const redirectUri = this.config.get('GOOGLE_CALLBACK_URL');
        const root = 'https://accounts.google.com/o/oauth2/v2/auth';
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'offline',
            prompt: 'consent',
        });
        const googleUrl = `${root}?${params.toString()}`;
        console.log('Redirect a Google:', googleUrl);
        res.redirect(googleUrl);
    }
    async googleCallback(req, res) {
        const ua = req.get('user-agent') ?? undefined;
        const ip = req.ip || undefined;
        const frontendUrl = this.config.get('FRONTEND_URL') ?? 'http://localhost:3000';
        try {
            const result = await this.auth.loginWithOAuthUser(req.user, ip, ua);
            const url = `${frontendUrl}/auth/google` +
                `?token=${encodeURIComponent(result.token)}` +
                `&message=${encodeURIComponent(result.message ?? 'Autenticado con Google')}` +
                `&email=${encodeURIComponent(result.usuario.email)}` +
                `&rol=${encodeURIComponent(result.usuario.rol)}`;
            console.log('REDIRECT FRONT:', url.toString());
            res.redirect(url.toString());
            return;
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'No se pudo completar el inicio de sesion con Google';
            res.redirect(`${frontendUrl}/auth/google?error=${encodeURIComponent(message)}`);
        }
    }
    async logout(req) {
        await this.auth.logout(req.user.jti);
        return { message: 'Sesion cerrada' };
    }
    async logoutAll(req) {
        await this.auth.logoutAll(req.user.id);
        return { message: 'Todas las sesiones fueron cerradas' };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, login_dto_1.LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('google'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "googleLogin", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)(google_auth_availability_guard_1.GoogleAuthAvailabilityGuard, (0, passport_1.AuthGuard)('google')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleCallback", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('logout-all'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logoutAll", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_1.ConfigService,
        integration_policy_service_1.IntegrationPolicyService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map