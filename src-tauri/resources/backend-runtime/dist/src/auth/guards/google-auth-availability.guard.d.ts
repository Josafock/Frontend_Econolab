import { CanActivate } from '@nestjs/common';
import { IntegrationPolicyService } from '../../runtime/integration-policy.service';
export declare class GoogleAuthAvailabilityGuard implements CanActivate {
    private readonly integrationPolicy;
    constructor(integrationPolicy: IntegrationPolicyService);
    canActivate(): boolean;
}
