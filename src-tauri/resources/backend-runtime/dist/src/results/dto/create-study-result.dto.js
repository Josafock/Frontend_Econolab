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
exports.CreateStudyResultDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const study_result_value_dto_1 = require("./study-result-value.dto");
class CreateStudyResultDto {
    serviceOrderId;
    serviceOrderItemId;
    sampleAt;
    reportedAt;
    method;
    observations;
    isDraft;
    values;
}
exports.CreateStudyResultDto = CreateStudyResultDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({
        message: 'El identificador del servicio debe ser un número entero.',
    }),
    __metadata("design:type", Number)
], CreateStudyResultDto.prototype, "serviceOrderId", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({
        message: 'El identificador del estudio dentro del servicio debe ser un número entero.',
    }),
    __metadata("design:type", Number)
], CreateStudyResultDto.prototype, "serviceOrderItemId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'La fecha de muestra no es válida.' }),
    __metadata("design:type", String)
], CreateStudyResultDto.prototype, "sampleAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'La fecha de reporte no es válida.' }),
    __metadata("design:type", String)
], CreateStudyResultDto.prototype, "reportedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El método debe ser una cadena de texto.' }),
    __metadata("design:type", String)
], CreateStudyResultDto.prototype, "method", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Las observaciones deben ser una cadena de texto.' }),
    __metadata("design:type", String)
], CreateStudyResultDto.prototype, "observations", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    (0, class_validator_1.IsBoolean)({ message: 'El campo borrador debe ser verdadero o falso.' }),
    __metadata("design:type", Boolean)
], CreateStudyResultDto.prototype, "isDraft", void 0);
__decorate([
    (0, class_validator_1.IsArray)({ message: 'Los resultados deben venir en un arreglo.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => study_result_value_dto_1.StudyResultValueDto),
    __metadata("design:type", Array)
], CreateStudyResultDto.prototype, "values", void 0);
//# sourceMappingURL=create-study-result.dto.js.map