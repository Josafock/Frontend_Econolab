import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import { AuthenticatedUser, RequestWithUser } from '../common/types/auth-request.type';
import { IntegrationPolicyService } from '../runtime/integration-policy.service';
export declare class AuthController {
    private readonly auth;
    private readonly config;
    private readonly integrationPolicy;
    constructor(auth: AuthService, config: ConfigService, integrationPolicy: IntegrationPolicyService);
    login(req: Request, dto: LoginDto): Promise<{
        message: string;
        token: string;
        usuario: {
            id: string;
            nombre: string;
            email: string;
            rol: import("../common/enums/roles.enum").Role;
        };
    }>;
    googleLogin(res: Response): void;
    googleCallback(req: RequestWithUser<User>, res: Response): Promise<void>;
    logout(req: RequestWithUser<AuthenticatedUser>): Promise<{
        message: string;
    }>;
    logoutAll(req: RequestWithUser<AuthenticatedUser>): Promise<{
        message: string;
    }>;
}
