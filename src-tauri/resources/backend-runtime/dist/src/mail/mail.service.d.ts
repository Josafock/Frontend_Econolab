import { Transporter } from 'nodemailer';
import { IntegrationPolicyService } from '../runtime/integration-policy.service';
interface EmailPayload {
    nombre: string;
    email: string;
    token: string;
}
export declare class MailService {
    private readonly integrationPolicy;
    private readonly transporter;
    private readonly logger;
    constructor(integrationPolicy: IntegrationPolicyService, transporter: Transporter);
    assertDeliveryAvailable(featureLabel?: string): void;
    private getFrontendUrlOrThrow;
    private sendEmail;
    sendConfirmationEmail({ nombre, email, token }: EmailPayload): Promise<void>;
    sendPasswordResetToken({ nombre, email, token }: EmailPayload): Promise<void>;
}
export {};
