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
exports.CreateStudyDetailDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const study_detail_entity_1 = require("../entities/study-detail.entity");
class CreateStudyDetailDto {
    dataType;
    name;
    sortOrder;
    unit;
    referenceValue;
    parentId;
}
exports.CreateStudyDetailDto = CreateStudyDetailDto;
__decorate([
    (0, class_validator_1.IsEnum)(study_detail_entity_1.StudyDetailType, {
        message: 'El tipo de dato es invalido. Valores permitidos: category, parameter.',
    }),
    __metadata("design:type", String)
], CreateStudyDetailDto.prototype, "dataType", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El nombre debe ser una cadena de texto.' }),
    (0, class_validator_1.Length)(1, 150, { message: 'El nombre del detalle es obligatorio.' }),
    __metadata("design:type", String)
], CreateStudyDetailDto.prototype, "name", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ message: 'El orden debe ser un numero entero.' }),
    (0, class_validator_1.Min)(1, { message: 'El orden minimo es 1.' }),
    __metadata("design:type", Number)
], CreateStudyDetailDto.prototype, "sortOrder", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La unidad debe ser una cadena de texto.' }),
    __metadata("design:type", String)
], CreateStudyDetailDto.prototype, "unit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({
        message: 'Los valores de referencia deben ser una cadena de texto.',
    }),
    __metadata("design:type", String)
], CreateStudyDetailDto.prototype, "referenceValue", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === '' || value === undefined)
            return undefined;
        if (value === null)
            return null;
        return Number(value);
    }),
    (0, class_validator_1.ValidateIf)((_, value) => value !== null && value !== undefined),
    (0, class_validator_1.IsInt)({ message: 'El identificador del padre debe ser un numero entero.' }),
    __metadata("design:type", Object)
], CreateStudyDetailDto.prototype, "parentId", void 0);
//# sourceMappingURL=create-study-detail.dto.js.map