import { ConfigService } from '@nestjs/config';
import { type AppRuntimeMode } from '../config/app.config';
type MailCredentials = {
    user?: string;
    pass?: string;
};
type GoogleAuthCredentials = {
    clientId?: string;
    clientSecret?: string;
    callbackUrl?: string;
};
type GmailOauthCredentials = {
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
};
export declare class IntegrationPolicyService {
    private readonly configService;
    constructor(configService: ConfigService);
    private get appRuntimeConfig();
    private get integrationRuntimeConfig();
    get runtimeMode(): AppRuntimeMode;
    get mailEnabled(): boolean;
    get googleAuthEnabled(): boolean;
    get gmailOauthEnabled(): boolean;
    get frontendUrl(): string | undefined;
    get mailCredentials(): MailCredentials;
    get googleAuthCredentials(): GoogleAuthCredentials;
    get gmailOauthCredentials(): GmailOauthCredentials;
    get mailConfigured(): boolean;
    get googleAuthConfigured(): boolean;
    get gmailOauthConfigured(): boolean;
    private throwDisabledFeature;
    private throwMissingConfiguration;
    assertMailEnabled(featureLabel?: string): void;
    assertFrontendUrlConfigured(featureLabel?: string): void;
    assertGoogleAuthEnabled(featureLabel?: string): void;
    assertGmailOauthEnabled(featureLabel?: string): void;
}
export {};
