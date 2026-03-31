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
exports.UserLoginLog = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const portable_column_options_1 = require("../../database/portable-column-options");
let UserLoginLog = class UserLoginLog {
    id;
    user;
    emailIntent;
    success;
    ip;
    userAgent;
    createdAt;
};
exports.UserLoginLog = UserLoginLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)((0, portable_column_options_1.getPortableGeneratedPrimaryColumnOptions)(true)),
    __metadata("design:type", Object)
], UserLoginLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", Object)
], UserLoginLog.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], UserLoginLog.prototype, "emailIntent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], UserLoginLog.prototype, "success", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 45, nullable: true }),
    __metadata("design:type", Object)
], UserLoginLog.prototype, "ip", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, name: 'user_agent' }),
    __metadata("design:type", Object)
], UserLoginLog.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)((0, portable_column_options_1.getPortableCreateDateColumnOptions)({ name: 'created_at' })),
    __metadata("design:type", Date)
], UserLoginLog.prototype, "createdAt", void 0);
exports.UserLoginLog = UserLoginLog = __decorate([
    (0, typeorm_1.Entity)({ name: 'user_login_logs' })
], UserLoginLog);
//# sourceMappingURL=user-login-log.entity.js.map