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
exports.GmailOauthController = void 0;
const common_1 = require("@nestjs/common");
const googleapis_1 = require("googleapis");
const integration_policy_service_1 = require("../runtime/integration-policy.service");
let GmailOauthController = class GmailOauthController {
    integrationPolicy;
    oauth2;
    constructor(integrationPolicy) {
        this.integrationPolicy = integrationPolicy;
        const { clientId, clientSecret, redirectUri } = this.integrationPolicy.gmailOauthCredentials;
        this.oauth2 = new googleapis_1.google.auth.OAuth2(clientId || 'gmail-oauth-disabled-client', clientSecret || 'gmail-oauth-disabled-secret', redirectUri || 'http://localhost/gmail-oauth-disabled/callback');
    }
    start(res) {
        this.integrationPolicy.assertGmailOauthEnabled('La autorizacion manual de Gmail');
        const url = this.oauth2.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: ['https://www.googleapis.com/auth/gmail.send'],
        });
        res.redirect(url);
    }
    async callback(code) {
        this.integrationPolicy.assertGmailOauthEnabled('La autorizacion manual de Gmail');
        const { tokens } = await this.oauth2.getToken(code);
        return tokens;
    }
};
exports.GmailOauthController = GmailOauthController;
__decorate([
    (0, common_1.Get)('auth'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GmailOauthController.prototype, "start", null);
__decorate([
    (0, common_1.Get)('callback'),
    __param(0, (0, common_1.Query)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GmailOauthController.prototype, "callback", null);
exports.GmailOauthController = GmailOauthController = __decorate([
    (0, common_1.Controller)('gmail'),
    __metadata("design:paramtypes", [integration_policy_service_1.IntegrationPolicyService])
], GmailOauthController);
//# sourceMappingURL=gmail-oauth.controller.js.map