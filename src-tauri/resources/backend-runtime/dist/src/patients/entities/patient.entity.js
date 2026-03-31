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
exports.Patient = exports.PatientGender = void 0;
const typeorm_1 = require("typeorm");
const sync_metadata_entity_1 = require("../../common/entities/sync-metadata.entity");
const portable_column_options_1 = require("../../database/portable-column-options");
var PatientGender;
(function (PatientGender) {
    PatientGender["MALE"] = "male";
    PatientGender["FEMALE"] = "female";
    PatientGender["OTHER"] = "other";
})(PatientGender || (exports.PatientGender = PatientGender = {}));
let Patient = class Patient extends sync_metadata_entity_1.SyncMetadataEntity {
    id;
    firstName;
    lastName;
    middleName;
    gender;
    birthDate;
    phone;
    email;
    addressLine;
    addressBetween;
    addressCity;
    addressState;
    addressZip;
    documentType;
    documentNumber;
    isActive;
    createdAt;
    updatedAt;
};
exports.Patient = Patient;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Patient.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_patients_name'),
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Patient.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Patient.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Patient.prototype, "middleName", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableEnumColumnOptions)(PatientGender, PatientGender.OTHER)),
    __metadata("design:type", String)
], Patient.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], Patient.prototype, "birthDate", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_patients_phone'),
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], Patient.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_patients_email'),
    (0, typeorm_1.Column)({ length: 150, nullable: true }),
    __metadata("design:type", String)
], Patient.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Patient.prototype, "addressLine", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Patient.prototype, "addressBetween", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Patient.prototype, "addressCity", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Patient.prototype, "addressState", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], Patient.prototype, "addressZip", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], Patient.prototype, "documentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], Patient.prototype, "documentNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Patient.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)((0, portable_column_options_1.getPortableCreateDateColumnOptions)()),
    __metadata("design:type", Date)
], Patient.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)((0, portable_column_options_1.getPortableUpdateDateColumnOptions)()),
    __metadata("design:type", Date)
], Patient.prototype, "updatedAt", void 0);
exports.Patient = Patient = __decorate([
    (0, typeorm_1.Entity)({ name: 'patients' }),
    (0, typeorm_1.Unique)(['documentType', 'documentNumber'])
], Patient);
//# sourceMappingURL=patient.entity.js.map