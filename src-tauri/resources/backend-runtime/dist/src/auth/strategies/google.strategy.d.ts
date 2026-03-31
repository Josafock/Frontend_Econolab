import { Profile } from 'passport-google-oauth20';
import { UsersService } from 'src/users/users.service';
import { IntegrationPolicyService } from '../../runtime/integration-policy.service';
declare const GoogleStrategy_base: new (...args: unknown[]) => any;
export declare class GoogleStrategy extends GoogleStrategy_base {
    private readonly usersService;
    private readonly integrationPolicy;
    constructor(usersService: UsersService, integrationPolicy: IntegrationPolicyService);
    validate(_accessToken: string, _refreshToken: string, profile: Profile): Promise<import("../../users/entities/user.entity").User>;
}
export {};
