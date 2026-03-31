import { Role } from 'src/common/enums/roles.enum';
import { UserSession } from 'src/auth/entities/user-session.entity';
import { SyncMetadataEntity } from '../../common/entities/sync-metadata.entity';
export declare class User extends SyncMetadataEntity {
    sessions: UserSession[];
    id: string;
    nombre: string;
    email: string;
    password: string;
    token: string | null;
    confirmed: boolean;
    rol: Role;
    profileImageData: string | null;
    profileImageMimeType: string | null;
    googleAvatarUrl: string | null;
    resetTokenExpiresAt: Date | null;
    resetRequestCount: number;
    resetRequestWindowStart: Date | null;
    failedLoginAttempts: number;
    lockUntil: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
