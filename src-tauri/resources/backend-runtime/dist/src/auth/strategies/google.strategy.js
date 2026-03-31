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
exports.GoogleStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_google_oauth20_1 = require("passport-google-oauth20");
const users_service_1 = require("../../users/users.service");
const integration_policy_service_1 = require("../../runtime/integration-policy.service");
let GoogleStrategy = class GoogleStrategy extends (0, passport_1.PassportStrategy)(passport_google_oauth20_1.Strategy, 'google') {
    usersService;
    integrationPolicy;
    constructor(usersService, integrationPolicy) {
        const { clientId, clientSecret, callbackUrl } = integrationPolicy.googleAuthCredentials;
        super({
            clientID: clientId || 'google-auth-disabled-client',
            clientSecret: clientSecret || 'google-auth-disabled-secret',
            callbackURL: callbackUrl || 'http://localhost/google-auth-disabled/callback',
            scope: ['email', 'profile'],
        });
        this.usersService = usersService;
        this.integrationPolicy = integrationPolicy;
    }
    async validate(_accessToken, _refreshToken, profile) {
        if (!this.integrationPolicy.googleAuthEnabled) {
            throw new common_1.ServiceUnavailableException('El inicio de sesion con Google esta deshabilitado en este runtime.');
        }
        const email = profile.emails?.[0]?.value;
        const nombre = profile.displayName;
        const googleAvatarUrl = profile.photos?.[0]?.value ?? null;
        if (!email) {
            throw new common_1.UnauthorizedException('No se pudo obtener el email desde Google');
        }
        let user = await this.usersService.findByEmail(email);
        if (!user) {
            user = await this.usersService.registerFromGoogle({
                nombre,
                email,
                googleId: profile.id,
                googleAvatarUrl,
            });
        }
        if (!user.confirmed) {
            user = await this.usersService.confirmFromGoogle(user, googleAvatarUrl);
        }
        else {
            user = await this.usersService.syncGoogleAvatar(user, googleAvatarUrl);
        }
        return user;
    }
};
exports.GoogleStrategy = GoogleStrategy;
exports.GoogleStrategy = GoogleStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        integration_policy_service_1.IntegrationPolicyService])
], GoogleStrategy);
//# sourceMappingURL=google.strategy.js.map