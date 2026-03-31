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
exports.CreateServiceItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const service_order_entity_1 = require("../entities/service-order.entity");
class CreateServiceItemDto {
    publicId;
    studyId;
    priceType;
    quantity;
    discountPercent;
}
exports.CreateServiceItemDto = CreateServiceItemDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', {
        message: 'El publicId del item debe ser un UUID valido.',
    }),
    __metadata("design:type", String)
], CreateServiceItemDto.prototype, "publicId", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ message: 'El identificador del estudio debe ser un número entero.' }),
    __metadata("design:type", Number)
], CreateServiceItemDto.prototype, "studyId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(service_order_entity_1.ServiceItemPriceType, {
        message: 'El tipo de precio es inválido. Valores permitidos: normal, dif, special, hospital, other.',
    }),
    __metadata("design:type", String)
], CreateServiceItemDto.prototype, "priceType", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ message: 'La cantidad debe ser un número entero.' }),
    (0, class_validator_1.Min)(1, { message: 'La cantidad mínima es 1.' }),
    __metadata("design:type", Number)
], CreateServiceItemDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'El descuento debe ser numérico.' }),
    (0, class_validator_1.Min)(0, { message: 'El descuento no puede ser negativo.' }),
    __metadata("design:type", Number)
], CreateServiceItemDto.prototype, "discountPercent", void 0);
//# sourceMappingURL=service-item.dto.js.map