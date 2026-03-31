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
exports.UserSession = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const portable_column_options_1 = require("../../database/portable-column-options");
let UserSession = class UserSession {
    id;
    user;
    expiresAt;
    revoked;
    ip;
    userAgent;
    createdAt;
};
exports.UserSession = UserSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.sessions, { onDelete: 'CASCADE' }),
    __metadata("design:type", user_entity_1.User)
], UserSession.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableTimestampColumnOptions)({}, 'timestamp')),
    __metadata("design:type", Date)
], UserSession.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], UserSession.prototype, "revoked", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 45, nullable: true }),
    __metadata("design:type", Object)
], UserSession.prototype, "ip", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], UserSession.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)((0, portable_column_options_1.getPortableCreateDateColumnOptions)({}, 'timestamp')),
    __metadata("design:type", Date)
], UserSession.prototype, "createdAt", void 0);
exports.UserSession = UserSession = __decorate([
    (0, typeorm_1.Entity)()
], UserSession);
//# sourceMappingURL=user-session.entity.js.map