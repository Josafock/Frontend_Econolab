import { Transporter } from 'nodemailer';
import { IntegrationPolicyService } from '../runtime/integration-policy.service';
export declare const mailerConfig: (integrationPolicy: IntegrationPolicyService) => Transporter;
