"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const crypto_util_1 = require("../common/utils/crypto.util");
const token_util_1 = require("../common/utils/token.util");
const roles_enum_1 = require("../common/enums/roles.enum");
const mail_service_1 = require("../mail/mail.service");
const jwt_util_1 = require("../common/utils/jwt.util");
const runtime_policy_service_1 = require("../runtime/runtime-policy.service");
const profile_image_storage_service_1 = require("../storage/profile-image-storage.service");
let UsersService = class UsersService {
    userRepository;
    mailService;
    runtimePolicy;
    profileImageStorage;
    constructor(userRepository, mailService, runtimePolicy, profileImageStorage) {
        this.userRepository = userRepository;
        this.mailService = mailService;
        this.runtimePolicy = runtimePolicy;
        this.profileImageStorage = profileImageStorage;
    }
    async register(dto) {
        const exists = await this.findByEmail(dto.email);
        if (exists)
            throw new common_1.ConflictException('El correo ya esta en uso');
        return this.create(dto);
    }
    async confirmAccount(token) {
        const user = await this.findByToken(token);
        if (!user)
            throw new common_1.NotFoundException('Token no valido');
        user.confirmed = true;
        user.token = null;
        await this.userRepository.save(user);
        return {
            message: 'Cuenta confirmada correctamente. Espera a que un administrador te asigne un rol.',
        };
    }
    async forgotPassword(email) {
        this.mailService.assertDeliveryAvailable('La recuperacion de contrasena por correo');
        const user = await this.findByEmail(email);
        const genericResponse = {
            message: 'Si el correo existe, se enviara un enlace de recuperacion',
        };
        if (!user) {
            await new Promise((resolve) => setTimeout(resolve, 300));
            return genericResponse;
        }
        const now = new Date();
        const WINDOW_HOURS = 1;
        const MAX_REQUESTS = 3;
        if (!user.resetRequestWindowStart ||
            now.getTime() - user.resetRequestWindowStart.getTime() >
                WINDOW_HOURS * 60 * 60 * 1000) {
            user.resetRequestWindowStart = now;
            user.resetRequestCount = 0;
        }
        if (user.resetRequestCount >= MAX_REQUESTS) {
            return {
                message: 'Ya se envio recientemente un correo de recuperacion. Revisa tu bandeja o intentalo mas tarde.',
            };
        }
        user.token = (0, token_util_1.generateRandomToken)(6);
        user.resetTokenExpiresAt = new Date(now.getTime() + 60 * 60 * 1000);
        user.resetRequestCount++;
        await this.userRepository.save(user);
        await this.mailService.sendPasswordResetToken({
            nombre: user.nombre,
            email: user.email,
            token: user.token,
        });
        return genericResponse;
    }
    async validateResetToken(token) {
        const user = await this.findByToken(token);
        const now = new Date();
        if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < now) {
            throw new common_1.NotFoundException('Token no valido o expirado');
        }
        return { message: 'Token valido...' };
    }
    async resetPassword(token, newPass) {
        const user = await this.findByToken(token);
        const now = new Date();
        if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < now) {
            throw new common_1.NotFoundException('Token no valido o expirado');
        }
        user.password = await (0, crypto_util_1.hashPassword)(newPass);
        user.token = null;
        user.resetTokenExpiresAt = null;
        user.resetRequestCount = 0;
        user.resetRequestWindowStart = null;
        await this.userRepository.save(user);
        return { message: 'La contrasena se modifico correctamente' };
    }
    async updatePassword(userId, currentPass, newPass) {
        const user = await this.findOne(userId);
        const ok = await (0, crypto_util_1.checkPassword)(currentPass, user.password);
        if (!ok)
            throw new common_1.UnauthorizedException('Contrasena actual incorrecta');
        user.password = await (0, crypto_util_1.hashPassword)(newPass);
        await this.userRepository.save(user);
        return { message: 'Contrasena actualizada' };
    }
    async getProfile(userId) {
        const user = await this.findOne(userId);
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        return this.toProfileView(user);
    }
    async updateProfileImage(userId, file) {
        const user = await this.findOne(userId);
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        await this.profileImageStorage.storeProfileImage(user, file);
        await this.userRepository.save(user);
        return {
            message: 'Foto de perfil actualizada',
            user: await this.toProfileView(user),
        };
    }
    async updateProfile(userId, jti, dto) {
        const user = await this.findOne(userId);
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        const nextNombre = dto.nombre?.trim();
        const nextEmail = dto.email?.trim().toLowerCase();
        if (!nextNombre && !nextEmail) {
            throw new common_1.ConflictException('No hay cambios para guardar');
        }
        if (typeof nextNombre === 'string' && nextNombre) {
            user.nombre = nextNombre;
        }
        if (typeof nextEmail === 'string' &&
            nextEmail &&
            nextEmail !== user.email) {
            if (user.googleAvatarUrl) {
                throw new common_1.ForbiddenException('Las cuentas con Google no pueden cambiar el correo desde este perfil');
            }
            const existingUser = await this.findByEmail(nextEmail);
            if (existingUser && existingUser.id !== user.id) {
                throw new common_1.ConflictException('El correo ya esta en uso');
            }
            user.email = nextEmail;
        }
        await this.userRepository.save(user);
        const payload = {
            sub: user.id,
            rol: user.rol,
            nombre: user.nombre,
            email: user.email,
            jti,
        };
        return {
            message: 'Perfil actualizado',
            token: (0, jwt_util_1.generateJWT)(payload),
            user: await this.toProfileView(user),
        };
    }
    async checkPassword(userId, pass) {
        const user = await this.findOne(userId);
        const ok = await (0, crypto_util_1.checkPassword)(pass, user.password);
        if (!ok)
            throw new common_1.UnauthorizedException('Contrasena incorrecta');
        return { message: 'Contrasena correcta' };
    }
    async setRole(id, rol) {
        const user = await this.findOne(id);
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        if (!user.confirmed) {
            throw new common_1.UnauthorizedException('El usuario no ha confirmado su cuenta');
        }
        if (user.rol === roles_enum_1.Role.Admin) {
            throw new common_1.ForbiddenException('No se puede cambiar el rol de un usuario admin desde este panel');
        }
        user.rol = rol;
        await this.userRepository.save(user);
        return {
            message: 'Rol actualizado',
            usuario: this.toAdminUserView(user),
        };
    }
    async findConfirmedUnassigned() {
        const users = await this.userRepository.find({
            where: {
                confirmed: true,
                rol: roles_enum_1.Role.Unassigned,
            },
            order: { createdAt: 'ASC' },
        });
        return users.map((user) => this.toAdminUserView(user));
    }
    async findConfirmedWithRoles() {
        const users = await this.userRepository.find({
            where: {
                confirmed: true,
                rol: (0, typeorm_2.In)([roles_enum_1.Role.Admin, roles_enum_1.Role.Recepcionista]),
            },
            order: { createdAt: 'ASC' },
        });
        return users.map((user) => this.toAdminUserView(user));
    }
    async deleteUser(id) {
        this.runtimePolicy.assertHardDeleteAllowed('usuarios');
        const user = await this.findOne(id);
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        if (user.rol === roles_enum_1.Role.Admin) {
            throw new common_1.UnauthorizedException('No se puede eliminar un usuario admin');
        }
        await this.userRepository.remove(user);
        return { message: 'Usuario eliminado' };
    }
    async findOne(id) {
        return this.userRepository.findOne({ where: { id } });
    }
    async findByEmail(email) {
        return this.userRepository.findOne({ where: { email } });
    }
    async findByToken(token) {
        return this.userRepository.findOne({ where: { token } });
    }
    async create(dto) {
        const user = this.userRepository.create({
            ...dto,
            rol: roles_enum_1.Role.Unassigned,
            password: await (0, crypto_util_1.hashPassword)(dto.password),
            token: (0, token_util_1.generateRandomToken)(6),
            confirmed: false,
        });
        await this.userRepository.save(user);
        return user;
    }
    async registerFromGoogle(data) {
        const randomPass = await (0, crypto_util_1.hashPassword)(`google-${data.email}-${Date.now()}`);
        const user = this.userRepository.create({
            nombre: data.nombre,
            email: data.email,
            password: randomPass,
            confirmed: true,
            rol: roles_enum_1.Role.Unassigned,
            googleAvatarUrl: data.googleAvatarUrl ?? null,
        });
        return this.userRepository.save(user);
    }
    async confirmFromGoogle(user, googleAvatarUrl) {
        user.confirmed = true;
        user.token = null;
        if (googleAvatarUrl) {
            user.googleAvatarUrl = googleAvatarUrl;
        }
        return this.userRepository.save(user);
    }
    async syncGoogleAvatar(user, googleAvatarUrl) {
        if (!googleAvatarUrl) {
            return user;
        }
        if (user.googleAvatarUrl === googleAvatarUrl) {
            return user;
        }
        user.googleAvatarUrl = googleAvatarUrl;
        return this.userRepository.save(user);
    }
    async getProfileImageUrl(user) {
        return this.profileImageStorage.resolveProfileImageUrl(user);
    }
    async toProfileView(user) {
        return {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            confirmed: user.confirmed,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            profileImageUrl: await this.getProfileImageUrl(user),
            authProvider: user.googleAvatarUrl ? 'google' : 'local',
        };
    }
    toAdminUserView(user) {
        return {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            confirmed: user.confirmed,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        mail_service_1.MailService,
        runtime_policy_service_1.RuntimePolicyService,
        profile_image_storage_service_1.ProfileImageStorageService])
], UsersService);
//# sourceMappingURL=users.service.js.map