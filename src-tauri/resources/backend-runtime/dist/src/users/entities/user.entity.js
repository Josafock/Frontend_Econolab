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
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const typeorm_1 = require("typeorm");
const roles_enum_1 = require("../../common/enums/roles.enum");
const user_session_entity_1 = require("../../auth/entities/user-session.entity");
const sync_metadata_entity_1 = require("../../common/entities/sync-metadata.entity");
const portable_column_options_1 = require("../../database/portable-column-options");
let User = class User extends sync_metadata_entity_1.SyncMetadataEntity {
    sessions;
    id;
    nombre;
    email;
    password;
    token;
    confirmed;
    rol;
    profileImageData;
    profileImageMimeType;
    googleAvatarUrl;
    resetTokenExpiresAt;
    resetRequestCount;
    resetRequestWindowStart;
    failedLoginAttempts;
    lockUntil;
    createdAt;
    updatedAt;
};
exports.User = User;
__decorate([
    (0, typeorm_1.OneToMany)(() => user_session_entity_1.UserSession, (session) => session.user),
    __metadata("design:type", Array)
], User.prototype, "sessions", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], User.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 60 }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 6, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "confirmed", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableEnumColumnOptions)(roles_enum_1.Role, roles_enum_1.Role.Unassigned)),
    __metadata("design:type", String)
], User.prototype, "rol", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "profileImageData", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "profileImageMimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 1000, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "googleAvatarUrl", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableTimestampColumnOptions)({ nullable: true }, 'timestamp')),
    __metadata("design:type", Object)
], User.prototype, "resetTokenExpiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "resetRequestCount", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableTimestampColumnOptions)({ nullable: true }, 'timestamp')),
    __metadata("design:type", Object)
], User.prototype, "resetRequestWindowStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "failedLoginAttempts", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableTimestampColumnOptions)({ nullable: true }, 'timestamp')),
    __metadata("design:type", Object)
], User.prototype, "lockUntil", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)((0, portable_column_options_1.getPortableCreateDateColumnOptions)({}, 'timestamp')),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)((0, portable_column_options_1.getPortableUpdateDateColumnOptions)({}, 'timestamp')),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)()
], User);
//# sourceMappingURL=user.entity.js.map