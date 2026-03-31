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
exports.StudyResultValue = exports.StudyResult = void 0;
const typeorm_1 = require("typeorm");
const service_order_entity_1 = require("../../services/entities/service-order.entity");
const study_detail_entity_1 = require("../../studies/entities/study-detail.entity");
const sync_metadata_entity_1 = require("../../common/entities/sync-metadata.entity");
const portable_column_options_1 = require("../../database/portable-column-options");
let StudyResult = class StudyResult extends sync_metadata_entity_1.SyncMetadataEntity {
    id;
    serviceOrder;
    serviceOrderId;
    serviceOrderItem;
    serviceOrderItemId;
    sampleAt;
    reportedAt;
    method;
    observations;
    isDraft;
    isActive;
    values;
    createdAt;
    updatedAt;
};
exports.StudyResult = StudyResult;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], StudyResult.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => service_order_entity_1.ServiceOrder, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'service_order_id' }),
    __metadata("design:type", service_order_entity_1.ServiceOrder)
], StudyResult.prototype, "serviceOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'service_order_id' }),
    __metadata("design:type", Number)
], StudyResult.prototype, "serviceOrderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => service_order_entity_1.ServiceOrderItem, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'service_order_item_id' }),
    __metadata("design:type", service_order_entity_1.ServiceOrderItem)
], StudyResult.prototype, "serviceOrderItem", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'service_order_item_id' }),
    __metadata("design:type", Number)
], StudyResult.prototype, "serviceOrderItemId", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableTimestampColumnOptions)({ nullable: true })),
    __metadata("design:type", Date)
], StudyResult.prototype, "sampleAt", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableTimestampColumnOptions)({ nullable: true })),
    __metadata("design:type", Date)
], StudyResult.prototype, "reportedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150, nullable: true }),
    __metadata("design:type", String)
], StudyResult.prototype, "method", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], StudyResult.prototype, "observations", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], StudyResult.prototype, "isDraft", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], StudyResult.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => StudyResultValue, (value) => value.result, {
        cascade: true,
        eager: true,
    }),
    __metadata("design:type", Array)
], StudyResult.prototype, "values", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)((0, portable_column_options_1.getPortableCreateDateColumnOptions)()),
    __metadata("design:type", Date)
], StudyResult.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)((0, portable_column_options_1.getPortableUpdateDateColumnOptions)()),
    __metadata("design:type", Date)
], StudyResult.prototype, "updatedAt", void 0);
exports.StudyResult = StudyResult = __decorate([
    (0, typeorm_1.Entity)('study_results'),
    (0, typeorm_1.Index)('idx_study_results_service_order', ['serviceOrderId']),
    (0, typeorm_1.Index)('idx_study_results_service_item', ['serviceOrderItemId']),
    (0, typeorm_1.Index)('idx_study_results_active', ['isActive'])
], StudyResult);
let StudyResultValue = class StudyResultValue extends sync_metadata_entity_1.SyncMetadataEntity {
    id;
    result;
    studyResultId;
    studyDetail;
    studyDetailId;
    label;
    unit;
    referenceValue;
    value;
    sortOrder;
    visible;
    createdAt;
    updatedAt;
};
exports.StudyResultValue = StudyResultValue;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], StudyResultValue.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => StudyResult, (result) => result.values, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'study_result_id' }),
    __metadata("design:type", StudyResult)
], StudyResultValue.prototype, "result", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'study_result_id' }),
    __metadata("design:type", Number)
], StudyResultValue.prototype, "studyResultId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => study_detail_entity_1.StudyDetail, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'study_detail_id' }),
    __metadata("design:type", study_detail_entity_1.StudyDetail)
], StudyResultValue.prototype, "studyDetail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'study_detail_id', nullable: true }),
    __metadata("design:type", Number)
], StudyResultValue.prototype, "studyDetailId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150 }),
    __metadata("design:type", String)
], StudyResultValue.prototype, "label", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], StudyResultValue.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], StudyResultValue.prototype, "referenceValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], StudyResultValue.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], StudyResultValue.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], StudyResultValue.prototype, "visible", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)((0, portable_column_options_1.getPortableCreateDateColumnOptions)()),
    __metadata("design:type", Date)
], StudyResultValue.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)((0, portable_column_options_1.getPortableUpdateDateColumnOptions)()),
    __metadata("design:type", Date)
], StudyResultValue.prototype, "updatedAt", void 0);
exports.StudyResultValue = StudyResultValue = __decorate([
    (0, typeorm_1.Entity)('study_result_values')
], StudyResultValue);
//# sourceMappingURL=study-result.entity.js.map