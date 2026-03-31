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
exports.AdminUsersController = exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const users_service_1 = require("./users.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const mail_service_1 = require("../mail/mail.service");
const validate_token_dto_1 = require("./dto/validate-token.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const reset_password_dto_1 = require("./dto/reset.password.dto");
const update_password_dto_1 = require("./dto/update-password.dto");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_enum_1 = require("../common/enums/roles.enum");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const update_role_dto_1 = require("./dto/update-role.dto");
const id_validation_pipe_1 = require("../common/pipes/id-validation/id-validation.pipe");
const token_validation_pipe_1 = require("../common/pipes/token-validation/token-validation.pipe");
const file_validation_pipe_1 = require("../common/pipes/file-validation/file-validation.pipe");
let UsersController = class UsersController {
    usersService;
    mailService;
    constructor(usersService, mailService) {
        this.usersService = usersService;
        this.mailService = mailService;
    }
    async register(dto) {
        this.mailService.assertDeliveryAvailable('El registro con confirmacion por correo');
        const user = await this.usersService.register(dto);
        await this.mailService.sendConfirmationEmail({
            nombre: user.nombre,
            email: user.email,
            token: user.token,
        });
        return { message: 'Registro creado, revisa tu correo' };
    }
    confirm(dto) {
        return this.usersService.confirmAccount(dto.token);
    }
    forgot(dto) {
        return this.usersService.forgotPassword(dto.email);
    }
    validateReset(token) {
        return this.usersService.validateResetToken(token);
    }
    reset(token, dto) {
        return this.usersService.resetPassword(token, dto.password);
    }
    updatePassword(req, dto) {
        return this.usersService.updatePassword(req.user.id, dto.current_password, dto.password);
    }
    checkPassword(req, password) {
        return this.usersService.checkPassword(req.user.id, password);
    }
    getProfile(req) {
        return this.usersService.getProfile(req.user.id);
    }
    updateProfile(req, dto) {
        return this.usersService.updateProfile(req.user.id, req.user.jti, dto);
    }
    updateProfileImage(req, file) {
        return this.usersService.updateProfileImage(req.user.id, file);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('confirm-account'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [validate_token_dto_1.ValidateTokenDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "confirm", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "forgot", null);
__decorate([
    (0, common_1.Post)('validate-reset-token'),
    __param(0, (0, common_1.Body)('token', token_validation_pipe_1.TokenValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "validateReset", null);
__decorate([
    (0, common_1.Post)('reset-password/:token'),
    __param(0, (0, common_1.Param)('token', token_validation_pipe_1.TokenValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "reset", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('update-password'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_password_dto_1.UpdatePasswordDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updatePassword", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('check-password'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('password')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "checkPassword", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('me'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('profile-image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        storage: (0, multer_1.memoryStorage)(),
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)(new file_validation_pipe_1.FileValidationPipe({
        required: true,
        maxSizeBytes: 2 * 1024 * 1024,
    }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateProfileImage", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        mail_service_1.MailService])
], UsersController);
let AdminUsersController = class AdminUsersController {
    users;
    constructor(users) {
        this.users = users;
    }
    findUnassigned() {
        return this.users.findConfirmedUnassigned();
    }
    findWithRole() {
        return this.users.findConfirmedWithRoles();
    }
    updateRole(id, dto) {
        return this.users.setRole(id, dto.rol);
    }
    deleteUser(id) {
        return this.users.deleteUser(id);
    }
};
exports.AdminUsersController = AdminUsersController;
__decorate([
    (0, common_1.Get)('unassigned'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.Admin),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminUsersController.prototype, "findUnassigned", null);
__decorate([
    (0, common_1.Get)('with-role'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.Admin),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminUsersController.prototype, "findWithRole", null);
__decorate([
    (0, common_1.Patch)(':id/role'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.Admin),
    __param(0, (0, common_1.Param)('id', id_validation_pipe_1.IdValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_role_dto_1.UpdateRoleDto]),
    __metadata("design:returntype", void 0)
], AdminUsersController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.Admin),
    __param(0, (0, common_1.Param)('id', id_validation_pipe_1.IdValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminUsersController.prototype, "deleteUser", null);
exports.AdminUsersController = AdminUsersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('admin/users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], AdminUsersController);
//# sourceMappingURL=users.controller.js.map