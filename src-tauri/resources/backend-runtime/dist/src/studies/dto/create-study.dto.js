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
exports.CreateStudyDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const study_entity_1 = require("../entities/study.entity");
class CreateStudyDto {
    name;
    code;
    autoGenerateCode;
    description;
    durationMinutes;
    type;
    normalPrice;
    difPrice;
    specialPrice;
    hospitalPrice;
    otherPrice;
    defaultDiscountPercent;
    method;
    indicator;
    packageStudyIds;
    status;
}
exports.CreateStudyDto = CreateStudyDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'El nombre debe ser una cadena de texto.' }),
    (0, class_validator_1.Length)(1, 200, {
        message: 'El nombre del analisis es obligatorio y maximo de 200 caracteres.',
    }),
    __metadata("design:type", String)
], CreateStudyDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La clave debe ser una cadena de texto.' }),
    (0, class_validator_1.Length)(1, 50, {
        message: 'La clave debe tener entre 1 y 50 caracteres.',
    }),
    __metadata("design:type", String)
], CreateStudyDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    (0, class_validator_1.IsBoolean)({ message: 'La bandera de clave automatica es invalida.' }),
    __metadata("design:type", Boolean)
], CreateStudyDto.prototype, "autoGenerateCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La descripcion debe ser una cadena de texto.' }),
    __metadata("design:type", String)
], CreateStudyDto.prototype, "description", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'La duracion debe ser un numero de minutos.' }),
    (0, class_validator_1.Min)(1, { message: 'La duracion minima es de 1 minuto.' }),
    __metadata("design:type", Number)
], CreateStudyDto.prototype, "durationMinutes", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(study_entity_1.StudyType, {
        message: 'El tipo de estudio es invalido. Valores permitidos: study, package, other.',
    }),
    __metadata("design:type", String)
], CreateStudyDto.prototype, "type", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'El precio normal debe ser numerico.' }),
    (0, class_validator_1.Min)(0, { message: 'El precio normal no puede ser negativo.' }),
    __metadata("design:type", Number)
], CreateStudyDto.prototype, "normalPrice", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'El precio DIF debe ser numerico.' }),
    (0, class_validator_1.Min)(0, { message: 'El precio DIF no puede ser negativo.' }),
    __metadata("design:type", Number)
], CreateStudyDto.prototype, "difPrice", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'El precio especial debe ser numerico.' }),
    (0, class_validator_1.Min)(0, { message: 'El precio especial no puede ser negativo.' }),
    __metadata("design:type", Number)
], CreateStudyDto.prototype, "specialPrice", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'El precio hospital debe ser numerico.' }),
    (0, class_validator_1.Min)(0, { message: 'El precio hospital no puede ser negativo.' }),
    __metadata("design:type", Number)
], CreateStudyDto.prototype, "hospitalPrice", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'El campo "otros" debe ser numerico.' }),
    (0, class_validator_1.Min)(0, { message: 'El campo "otros" no puede ser negativo.' }),
    __metadata("design:type", Number)
], CreateStudyDto.prototype, "otherPrice", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'El porcentaje de descuento debe ser numerico.' }),
    (0, class_validator_1.Min)(0, { message: 'El porcentaje de descuento no puede ser negativo.' }),
    __metadata("design:type", Number)
], CreateStudyDto.prototype, "defaultDiscountPercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El metodo debe ser una cadena de texto.' }),
    __metadata("design:type", String)
], CreateStudyDto.prototype, "method", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El indicador debe ser una cadena de texto.' }),
    __metadata("design:type", String)
], CreateStudyDto.prototype, "indicator", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Los estudios del paquete deben venir en un arreglo.' }),
    (0, class_validator_1.ArrayUnique)({ message: 'No repitas estudios dentro del paquete.' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({
        each: true,
        message: 'Cada estudio del paquete debe ser un identificador numerico.',
    }),
    __metadata("design:type", Array)
], CreateStudyDto.prototype, "packageStudyIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(study_entity_1.StudyStatus, {
        message: 'El estatus es invalido. Valores permitidos: active, suspended.',
    }),
    __metadata("design:type", String)
], CreateStudyDto.prototype, "status", void 0);
//# sourceMappingURL=create-study.dto.js.map