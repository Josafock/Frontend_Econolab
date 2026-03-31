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
exports.Doctor = void 0;
const typeorm_1 = require("typeorm");
const sync_metadata_entity_1 = require("../../common/entities/sync-metadata.entity");
const portable_column_options_1 = require("../../database/portable-column-options");
let Doctor = class Doctor extends sync_metadata_entity_1.SyncMetadataEntity {
    id;
    firstName;
    lastName;
    middleName;
    email;
    phone;
    specialty;
    licenseNumber;
    notes;
    isActive;
    createdAt;
    updatedAt;
};
exports.Doctor = Doctor;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Doctor.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_doctors_name'),
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Doctor.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Doctor.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Doctor.prototype, "middleName", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_doctors_email'),
    (0, typeorm_1.Column)({ length: 150, nullable: true }),
    __metadata("design:type", String)
], Doctor.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_doctors_phone'),
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], Doctor.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150, nullable: true }),
    __metadata("design:type", String)
], Doctor.prototype, "specialty", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], Doctor.prototype, "licenseNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Doctor.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Doctor.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)((0, portable_column_options_1.getPortableCreateDateColumnOptions)()),
    __metadata("design:type", Date)
], Doctor.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)((0, portable_column_options_1.getPortableUpdateDateColumnOptions)()),
    __metadata("design:type", Date)
], Doctor.prototype, "updatedAt", void 0);
exports.Doctor = Doctor = __decorate([
    (0, typeorm_1.Entity)({ name: 'doctors' }),
    (0, typeorm_1.Unique)(['licenseNumber'])
], Doctor);
//# sourceMappingURL=doctor.entity.js.map