import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
type PassportInfo = Error | {
    name?: string;
} | null | undefined;
declare const SyncMachineAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class SyncMachineAuthGuard extends SyncMachineAuthGuard_base {
    private readonly configService;
    constructor(configService: ConfigService);
    private get runtimeConfig();
    private extractSyncToken;
    private safeTokenEquals;
    private createMachineUser;
    canActivate(context: ExecutionContext): Promise<boolean>;
    handleRequest<TUser = unknown>(err: unknown, user: TUser, info: PassportInfo, context: ExecutionContext, status?: unknown): TUser;
}
export {};
