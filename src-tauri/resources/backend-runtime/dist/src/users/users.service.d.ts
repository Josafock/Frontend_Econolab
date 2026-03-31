import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { Role } from 'src/common/enums/roles.enum';
import { MailService } from 'src/mail/mail.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RuntimePolicyService } from '../runtime/runtime-policy.service';
import { ProfileImageStorageService } from '../storage/profile-image-storage.service';
export declare class UsersService {
    private readonly userRepository;
    private readonly mailService;
    private readonly runtimePolicy;
    private readonly profileImageStorage;
    constructor(userRepository: Repository<User>, mailService: MailService, runtimePolicy: RuntimePolicyService, profileImageStorage: ProfileImageStorageService);
    register(dto: CreateUserDto): Promise<User>;
    confirmAccount(token: string): Promise<{
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    validateResetToken(token: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPass: string): Promise<{
        message: string;
    }>;
    updatePassword(userId: string, currentPass: string, newPass: string): Promise<{
        message: string;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        nombre: string;
        email: string;
        rol: Role;
        confirmed: boolean;
        createdAt: Date;
        updatedAt: Date;
        profileImageUrl: string | null;
        authProvider: string;
    }>;
    updateProfileImage(userId: string, file: Express.Multer.File): Promise<{
        message: string;
        user: {
            id: string;
            nombre: string;
            email: string;
            rol: Role;
            confirmed: boolean;
            createdAt: Date;
            updatedAt: Date;
            profileImageUrl: string | null;
            authProvider: string;
        };
    }>;
    updateProfile(userId: string, jti: string, dto: UpdateProfileDto): Promise<{
        message: string;
        token: string;
        user: {
            id: string;
            nombre: string;
            email: string;
            rol: Role;
            confirmed: boolean;
            createdAt: Date;
            updatedAt: Date;
            profileImageUrl: string | null;
            authProvider: string;
        };
    }>;
    checkPassword(userId: string, pass: string): Promise<{
        message: string;
    }>;
    setRole(id: string, rol: Role): Promise<{
        message: string;
        usuario: {
            id: string;
            nombre: string;
            email: string;
            rol: Role;
            confirmed: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    findConfirmedUnassigned(): Promise<{
        id: string;
        nombre: string;
        email: string;
        rol: Role;
        confirmed: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findConfirmedWithRoles(): Promise<{
        id: string;
        nombre: string;
        email: string;
        rol: Role;
        confirmed: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    deleteUser(id: string): Promise<{
        message: string;
    }>;
    findOne(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByToken(token: string): Promise<User | null>;
    create(dto: CreateUserDto): Promise<User>;
    registerFromGoogle(data: {
        nombre: string;
        email: string;
        googleId: string;
        googleAvatarUrl?: string | null;
    }): Promise<User>;
    confirmFromGoogle(user: User, googleAvatarUrl?: string | null): Promise<User>;
    syncGoogleAvatar(user: User, googleAvatarUrl?: string | null): Promise<User>;
    private getProfileImageUrl;
    private toProfileView;
    private toAdminUserView;
}
