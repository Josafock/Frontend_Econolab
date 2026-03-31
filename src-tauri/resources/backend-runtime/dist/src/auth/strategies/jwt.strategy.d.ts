import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { AppJwtPayload } from 'src/common/utils/jwt.util';
import { UserSession } from '../entities/user-session.entity';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly sessionsRepo;
    constructor(cfg: ConfigService, sessionsRepo: Repository<UserSession>);
    validate(payload: AppJwtPayload): Promise<{
        id: string;
        email: string;
        rol: import("../../common/enums/roles.enum").Role;
        jti: string;
    }>;
}
export {};
