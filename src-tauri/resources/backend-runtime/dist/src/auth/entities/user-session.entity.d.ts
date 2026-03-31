import { User } from 'src/users/entities/user.entity';
export declare class UserSession {
    id: string;
    user: User;
    expiresAt: Date;
    revoked: boolean;
    ip: string | null;
    userAgent: string | null;
    createdAt: Date;
}
