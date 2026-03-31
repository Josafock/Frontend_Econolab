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
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const integration_policy_service_1 = require("../runtime/integration-policy.service");
const constants_1 = require("./constants");
let MailService = MailService_1 = class MailService {
    integrationPolicy;
    transporter;
    logger = new common_1.Logger(MailService_1.name);
    constructor(integrationPolicy, transporter) {
        this.integrationPolicy = integrationPolicy;
        this.transporter = transporter;
    }
    assertDeliveryAvailable(featureLabel = 'El envio de correo') {
        this.integrationPolicy.assertMailEnabled(featureLabel);
    }
    getFrontendUrlOrThrow(featureLabel) {
        this.integrationPolicy.assertFrontendUrlConfigured(featureLabel);
        return this.integrationPolicy.frontendUrl;
    }
    async sendEmail(to, subject, html) {
        this.assertDeliveryAvailable();
        const fromEmail = this.integrationPolicy.mailCredentials.user;
        const fromName = 'Econolab Huejutla';
        if (!fromEmail) {
            throw new common_1.ServiceUnavailableException('GMAIL_USER no esta configurado');
        }
        try {
            await this.transporter.sendMail({
                from: `${fromName} <${fromEmail}>`,
                to,
                subject,
                html,
            });
        }
        catch (error) {
            this.logger.error('Fallo al enviar correo', error);
            throw new common_1.ServiceUnavailableException('No se pudo enviar el correo en este momento');
        }
    }
    async sendConfirmationEmail({ nombre, email, token }) {
        const frontendUrl = this.getFrontendUrlOrThrow('La confirmacion de cuenta por correo');
        await this.sendEmail(email, 'Econolab Huejutla - Confirma tu cuenta', `
        <p>Hola ${nombre}, has creado tu cuenta en Econolab Huejutla, ya casi esta lista.</p>
        <p>Visita el siguiente enlace:</p>
        <a href="${frontendUrl}/auth/confirm-account">
          Confirmar cuenta
        </a>
        <p>e ingresa el codigo: <b>${token}</b></p>
      `);
    }
    async sendPasswordResetToken({ nombre, email, token }) {
        const frontendUrl = this.getFrontendUrlOrThrow('La recuperacion de contrasena por correo');
        await this.sendEmail(email, 'Econolab Huejutla - Restablece tu contrasena', `
        <p>Hola ${nombre}, has solicitado restablecer tu contrasena.</p>
        <p>Visita el siguiente enlace:</p>
        <a href="${frontendUrl}/auth/new-password">
          Restablecer contrasena
        </a>
        <p>e ingresa el codigo: <b>${token}</b></p>
      `);
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(constants_1.MAILER_TRANSPORT)),
    __metadata("design:paramtypes", [integration_policy_service_1.IntegrationPolicyService, Object])
], MailService);
//# sourceMappingURL=mail.service.js.map