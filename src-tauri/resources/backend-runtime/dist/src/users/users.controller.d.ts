import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { MailService } from 'src/mail/mail.service';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset.password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Role } from 'src/common/enums/roles.enum';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RequestWithUser } from '../common/types/auth-request.type';
export declare class UsersController {
    private readonly usersService;
    private readonly mailService;
    constructor(usersService: UsersService, mailService: MailService);
    register(dto: CreateUserDto): Promise<{
        message: string;
    }>;
    confirm(dto: ValidateTokenDto): Promise<{
        message: string;
    }>;
    forgot(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    validateReset(token: string): Promise<{
        message: string;
    }>;
    reset(token: string, dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    updatePassword(req: RequestWithUser, dto: UpdatePasswordDto): Promise<{
        message: string;
    }>;
    checkPassword(req: RequestWithUser, password: string): Promise<{
        message: string;
    }>;
    getProfile(req: RequestWithUser): Promise<{
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
    updateProfile(req: RequestWithUser, dto: UpdateProfileDto): Promise<{
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
    updateProfileImage(req: RequestWithUser, file: Express.Multer.File): Promise<{
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
}
export declare class AdminUsersController {
    private readonly users;
    constructor(users: UsersService);
    findUnassigned(): Promise<{
        id: string;
        nombre: string;
        email: string;
        rol: Role;
        confirmed: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findWithRole(): Promise<{
        id: string;
        nombre: string;
        email: string;
        rol: Role;
        confirmed: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    updateRole(id: string, dto: UpdateRoleDto): Promise<{
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
    deleteUser(id: string): Promise<{
        message: string;
    }>;
}
