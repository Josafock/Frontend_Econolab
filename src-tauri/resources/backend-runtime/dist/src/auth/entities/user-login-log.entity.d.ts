import { User } from 'src/users/entities/user.entity';
export declare class UserLoginLog {
    id: string | number;
    user?: User | null;
    emailIntent?: string | null;
    success: boolean;
    ip?: string | null;
    userAgent?: string | null;
    createdAt: Date;
}
