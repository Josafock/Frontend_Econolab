import { ExecutionContext } from '@nestjs/common';
type PassportInfo = Error | {
    name?: string;
} | null | undefined;
declare const JwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtAuthGuard extends JwtAuthGuard_base {
    handleRequest<TUser = unknown>(err: unknown, user: TUser, info: PassportInfo, context: ExecutionContext, status?: unknown): TUser;
}
export {};
