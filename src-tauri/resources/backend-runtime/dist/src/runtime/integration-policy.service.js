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
exports.IntegrationPolicyService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let IntegrationPolicyService = class IntegrationPolicyService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    get appRuntimeConfig() {
        return this.configService.getOrThrow('app');
    }
    get integrationRuntimeConfig() {
        return this.configService.getOrThrow('integrations');
    }
    get runtimeMode() {
        return this.appRuntimeConfig.runtimeMode;
    }
    get mailEnabled() {
        return this.integrationRuntimeConfig.mailEnabled;
    }
    get googleAuthEnabled() {
        return this.integrationRuntimeConfig.googleAuthEnabled;
    }
    get gmailOauthEnabled() {
        return this.integrationRuntimeConfig.gmailOauthEnabled;
    }
    get frontendUrl() {
        return this.configService.get('FRONTEND_URL')?.trim();
    }
    get mailCredentials() {
        return {
            user: this.configService.get('GMAIL_USER')?.trim(),
            pass: this.configService.get('GMAIL_PASS')?.trim(),
        };
    }
    get googleAuthCredentials() {
        return {
            clientId: this.configService.get('GOOGLE_CLIENT_ID')?.trim(),
            clientSecret: this.configService
                .get('GOOGLE_CLIENT_SECRET')
                ?.trim(),
            callbackUrl: this.configService.get('GOOGLE_CALLBACK_URL')?.trim(),
        };
    }
    get gmailOauthCredentials() {
        return {
            clientId: this.configService.get('GOOGLE_CLIENT_ID')?.trim(),
            clientSecret: this.configService
                .get('GOOGLE_CLIENT_SECRET')
                ?.trim(),
            redirectUri: this.configService.get('GOOGLE_REDIRECT_URI')?.trim(),
        };
    }
    get mailConfigured() {
        const { user, pass } = this.mailCredentials;
        return Boolean(user && pass);
    }
    get googleAuthConfigured() {
        const { clientId, clientSecret, callbackUrl } = this.googleAuthCredentials;
        return Boolean(clientId && clientSecret && callbackUrl);
    }
    get gmailOauthConfigured() {
        const { clientId, clientSecret, redirectUri } = this.gmailOauthCredentials;
        return Boolean(clientId && clientSecret && redirectUri);
    }
    throwDisabledFeature(featureLabel) {
        throw new common_1.ServiceUnavailableException(`${featureLabel} esta deshabilitado en el runtime ${this.runtimeMode}. Esta operacion requiere servicios online.`);
    }
    throwMissingConfiguration(featureLabel, variableNames) {
        throw new common_1.ServiceUnavailableException(`${featureLabel} no esta configurado correctamente. Faltan: ${variableNames.join(', ')}.`);
    }
    assertMailEnabled(featureLabel = 'El envio de correo') {
        if (!this.mailEnabled) {
            this.throwDisabledFeature(featureLabel);
        }
        const { user, pass } = this.mailCredentials;
        const missingVariables = [
            !user ? 'GMAIL_USER' : null,
            !pass ? 'GMAIL_PASS' : null,
        ].filter((value) => Boolean(value));
        if (missingVariables.length > 0) {
            this.throwMissingConfiguration(featureLabel, missingVariables);
        }
    }
    assertFrontendUrlConfigured(featureLabel = 'Los enlaces del frontend') {
        if (this.frontendUrl) {
            return;
        }
        this.throwMissingConfiguration(featureLabel, ['FRONTEND_URL']);
    }
    assertGoogleAuthEnabled(featureLabel = 'El inicio de sesion con Google') {
        if (!this.googleAuthEnabled) {
            this.throwDisabledFeature(featureLabel);
        }
        const { clientId, clientSecret, callbackUrl } = this.googleAuthCredentials;
        const missingVariables = [
            !clientId ? 'GOOGLE_CLIENT_ID' : null,
            !clientSecret ? 'GOOGLE_CLIENT_SECRET' : null,
            !callbackUrl ? 'GOOGLE_CALLBACK_URL' : null,
        ].filter((value) => Boolean(value));
        if (missingVariables.length > 0) {
            this.throwMissingConfiguration(featureLabel, missingVariables);
        }
    }
    assertGmailOauthEnabled(featureLabel = 'La autorizacion de Gmail') {
        if (!this.gmailOauthEnabled) {
            this.throwDisabledFeature(featureLabel);
        }
        const { clientId, clientSecret, redirectUri } = this.gmailOauthCredentials;
        const missingVariables = [
            !clientId ? 'GOOGLE_CLIENT_ID' : null,
            !clientSecret ? 'GOOGLE_CLIENT_SECRET' : null,
            !redirectUri ? 'GOOGLE_REDIRECT_URI' : null,
        ].filter((value) => Boolean(value));
        if (missingVariables.length > 0) {
            this.throwMissingConfiguration(featureLabel, missingVariables);
        }
    }
};
exports.IntegrationPolicyService = IntegrationPolicyService;
exports.IntegrationPolicyService = IntegrationPolicyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], IntegrationPolicyService);
//# sourceMappingURL=integration-policy.service.js.map