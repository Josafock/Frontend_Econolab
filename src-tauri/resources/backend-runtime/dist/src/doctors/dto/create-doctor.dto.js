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
exports.CreateDoctorDto = void 0;
const class_validator_1 = require("class-validator");
class CreateDoctorDto {
    firstName;
    lastName;
    middleName;
    email;
    phone;
    specialty;
    licenseNumber;
    notes;
}
exports.CreateDoctorDto = CreateDoctorDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'El nombre debe ser una cadena de texto.' }),
    (0, class_validator_1.Length)(1, 100, {
        message: 'El nombre es obligatorio y máximo de 100 caracteres.',
    }),
    __metadata("design:type", String)
], CreateDoctorDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El apellido paterno debe ser una cadena de texto.' }),
    (0, class_validator_1.Length)(1, 100, {
        message: 'El apellido paterno es obligatorio y máximo de 100 caracteres.',
    }),
    __metadata("design:type", String)
], CreateDoctorDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El apellido materno debe ser una cadena de texto.' }),
    (0, class_validator_1.Length)(1, 100, {
        message: 'El apellido materno debe tener máximo 100 caracteres.',
    }),
    __metadata("design:type", String)
], CreateDoctorDto.prototype, "middleName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'El correo electrónico no tiene un formato válido.' }),
    __metadata("design:type", String)
], CreateDoctorDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El teléfono debe ser una cadena de texto.' }),
    __metadata("design:type", String)
], CreateDoctorDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La especialidad debe ser una cadena de texto.' }),
    (0, class_validator_1.Length)(1, 150, {
        message: 'La especialidad debe tener máximo 150 caracteres.',
    }),
    __metadata("design:type", String)
], CreateDoctorDto.prototype, "specialty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La cédula profesional debe ser una cadena de texto.' }),
    (0, class_validator_1.Length)(1, 50, {
        message: 'La cédula profesional debe tener máximo 50 caracteres.',
    }),
    __metadata("design:type", String)
], CreateDoctorDto.prototype, "licenseNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Las notas deben ser una cadena de texto.' }),
    __metadata("design:type", String)
], CreateDoctorDto.prototype, "notes", void 0);
//# sourceMappingURL=create-doctor.dto.js.map