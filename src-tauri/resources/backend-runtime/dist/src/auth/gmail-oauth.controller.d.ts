import { Response } from 'express';
import { IntegrationPolicyService } from '../runtime/integration-policy.service';
export declare class GmailOauthController {
    private readonly integrationPolicy;
    private readonly oauth2;
    constructor(integrationPolicy: IntegrationPolicyService);
    start(res: Response): void;
    callback(code: string): Promise<import("google-auth-library").Credentials>;
}
