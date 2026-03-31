export declare function getIntegrationRuntimeConfig(env?: NodeJS.ProcessEnv): {
    mailEnabled: boolean;
    googleAuthEnabled: boolean;
    gmailOauthEnabled: boolean;
};
export type IntegrationRuntimeConfig = ReturnType<typeof getIntegrationRuntimeConfig>;
export declare const integrationsConfig: (() => {
    mailEnabled: boolean;
    googleAuthEnabled: boolean;
    gmailOauthEnabled: boolean;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    mailEnabled: boolean;
    googleAuthEnabled: boolean;
    gmailOauthEnabled: boolean;
}>;
