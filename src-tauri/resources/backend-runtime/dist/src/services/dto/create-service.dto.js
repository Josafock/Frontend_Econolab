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
exports.CreateServiceDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const service_order_entity_1 = require("../entities/service-order.entity");
const service_item_dto_1 = require("./service-item.dto");
class CreateServiceDto {
    folio;
    autoGenerateFolio;
    patientId;
    doctorId;
    branchName;
    sampleAt;
    deliveryAt;
    status;
    courtesyPercent;
    notes;
    items;
}
exports.CreateServiceDto = CreateServiceDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El folio debe ser una cadena de texto.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El folio no puede estar vacio.' }),
    __metadata("design:type", String)
], CreateServiceDto.prototype, "folio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    (0, class_validator_1.IsBoolean)({ message: 'La bandera de folio automatico es invalida.' }),
    __metadata("design:type", Boolean)
], CreateServiceDto.prototype, "autoGenerateFolio", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({
        message: 'El identificador del paciente debe ser un número entero.',
    }),
    __metadata("design:type", Number)
], CreateServiceDto.prototype, "patientId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ message: 'El identificador del médico debe ser un número entero.' }),
    __metadata("design:type", Number)
], CreateServiceDto.prototype, "doctorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La sucursal debe ser una cadena de texto.' }),
    __metadata("design:type", String)
], CreateServiceDto.prototype, "branchName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'La fecha/hora de toma de muestra no es válida.' }),
    __metadata("design:type", String)
], CreateServiceDto.prototype, "sampleAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'La fecha/hora de entrega no es válida.' }),
    __metadata("design:type", String)
], CreateServiceDto.prototype, "deliveryAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(service_order_entity_1.ServiceStatus, {
        message: 'El estatus es inválido. Valores permitidos: pending, in_progress, delayed, completed, cancelled.',
    }),
    __metadata("design:type", String)
], CreateServiceDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'El porcentaje de cortesía debe ser numérico.' }),
    (0, class_validator_1.Min)(0, { message: 'La cortesía no puede ser negativa.' }),
    (0, class_validator_1.Max)(100, { message: 'La cortesía no puede ser mayor a 100.' }),
    __metadata("design:type", Number)
], CreateServiceDto.prototype, "courtesyPercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Las notas deben ser una cadena de texto.' }),
    __metadata("design:type", String)
], CreateServiceDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsArray)({ message: 'Los estudios deben venir en un arreglo.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => service_item_dto_1.CreateServiceItemDto),
    __metadata("design:type", Array)
], CreateServiceDto.prototype, "items", void 0);
//# sourceMappingURL=create-service.dto.js.map