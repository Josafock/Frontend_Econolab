import { Repository } from 'typeorm';
import { UserLoginLog } from './entities/user-login-log.entity';
import { User } from '../users/entities/user.entity';
export declare class AuthEventsService {
    private readonly logsRepo;
    constructor(logsRepo: Repository<UserLoginLog>);
    logSuccess(user: User, ip?: string, ua?: string): Promise<void>;
    logFailure(email: string | null, ip?: string, ua?: string): Promise<void>;
}
