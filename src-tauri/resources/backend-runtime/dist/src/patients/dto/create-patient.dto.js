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
exports.CreatePatientDto = void 0;
const class_validator_1 = require("class-validator");
const patient_entity_1 = require("../entities/patient.entity");
class CreatePatientDto {
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
}
exports.CreatePatientDto = CreatePatientDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'El nombre debe ser una cadena de texto.' }),
    (0, class_validator_1.Length)(1, 100, {
        message: 'El nombre es obligatorio y máximo de 100 caracteres.',
    }),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El apellido paterno debe ser una cadena de texto.' }),
    (0, class_validator_1.Length)(1, 100, {
        message: 'El apellido paterno es obligatorio y máximo de 100 caracteres.',
    }),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El apellido materno debe ser una cadena de texto.' }),
    (0, class_validator_1.Length)(1, 100, {
        message: 'El apellido materno debe tener máximo 100 caracteres.',
    }),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "middleName", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(patient_entity_1.PatientGender, {
        message: 'El sexo es inválido. Valores permitidos: male, female, other.',
    }),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "gender", void 0);
__decorate([
    (0, class_validator_1.IsDateString)({}, {
        message: 'La fecha de nacimiento debe tener formato válido (YYYY-MM-DD).',
    }),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "birthDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El teléfono debe ser una cadena de texto.' }),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'El correo electrónico no tiene un formato válido.' }),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La dirección debe ser una cadena de texto.' }),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "addressLine", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({
        message: 'El campo "entre calles" debe ser una cadena de texto.',
    }),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "addressBetween", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La ciudad debe ser una cadena de texto.' }),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "addressCity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El estado debe ser una cadena de texto.' }),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "addressState", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El código postal debe ser una cadena de texto.' }),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "addressZip", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El tipo de documento debe ser una cadena de texto.' }),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "documentType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El número de documento debe ser una cadena de texto.' }),
    __metadata("design:type", String)
], CreatePatientDto.prototype, "documentNumber", void 0);
//# sourceMappingURL=create-patient.dto.js.map