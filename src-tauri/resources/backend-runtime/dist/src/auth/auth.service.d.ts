import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/roles.enum';
import { SyncRunnerService } from '../sync/sync-runner.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthEventsService } from './auth-events.service';
import { LoginDto } from './dto/login.dto';
import { UserSession } from './entities/user-session.entity';
export declare class AuthService {
    private readonly users;
    private readonly authEvents;
    private readonly configService;
    private readonly syncRunner;
    private readonly sessionsRepo;
    private readonly usersRepo;
    private readonly logger;
    constructor(users: UsersService, authEvents: AuthEventsService, configService: ConfigService, syncRunner: SyncRunnerService, sessionsRepo: Repository<UserSession>, usersRepo: Repository<User>);
    private get appRuntimeConfig();
    private tryHydrateUsersForDesktopLogin;
    private registerFailedLogin;
    private resetLoginAttempts;
    private getSessionExpiresAt;
    private createAuthenticatedResponse;
    login(dto: LoginDto, ip?: string, userAgent?: string): Promise<{
        message: string;
        token: string;
        usuario: {
            id: string;
            nombre: string;
            email: string;
            rol: Role;
        };
    }>;
    loginWithOAuthUser(user: User, ip?: string, userAgent?: string): Promise<{
        message: string;
        token: string;
        usuario: {
            id: string;
            nombre: string;
            email: string;
            rol: Role;
        };
    }>;
    logout(jti: string): Promise<void>;
    logoutAll(userId: string): Promise<void>;
}
