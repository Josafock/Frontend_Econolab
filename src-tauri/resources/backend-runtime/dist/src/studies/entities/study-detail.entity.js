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
exports.StudyDetail = exports.StudyDetailType = void 0;
const typeorm_1 = require("typeorm");
const study_entity_1 = require("./study.entity");
const sync_metadata_entity_1 = require("../../common/entities/sync-metadata.entity");
const portable_column_options_1 = require("../../database/portable-column-options");
var StudyDetailType;
(function (StudyDetailType) {
    StudyDetailType["CATEGORY"] = "category";
    StudyDetailType["PARAMETER"] = "parameter";
})(StudyDetailType || (exports.StudyDetailType = StudyDetailType = {}));
let StudyDetail = class StudyDetail extends sync_metadata_entity_1.SyncMetadataEntity {
    id;
    study;
    studyId;
    parent;
    parentId;
    dataType;
    name;
    sortOrder;
    unit;
    referenceValue;
    isActive;
    createdAt;
    updatedAt;
};
exports.StudyDetail = StudyDetail;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], StudyDetail.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => study_entity_1.Study, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'study_id' }),
    __metadata("design:type", study_entity_1.Study)
], StudyDetail.prototype, "study", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'study_id' }),
    __metadata("design:type", Number)
], StudyDetail.prototype, "studyId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => StudyDetail, { nullable: true, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'parent_id' }),
    __metadata("design:type", Object)
], StudyDetail.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parent_id', nullable: true }),
    __metadata("design:type", Object)
], StudyDetail.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableEnumColumnOptions)(StudyDetailType)),
    __metadata("design:type", String)
], StudyDetail.prototype, "dataType", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150 }),
    __metadata("design:type", String)
], StudyDetail.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], StudyDetail.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], StudyDetail.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], StudyDetail.prototype, "referenceValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], StudyDetail.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)((0, portable_column_options_1.getPortableCreateDateColumnOptions)({}, 'timestamp')),
    __metadata("design:type", Date)
], StudyDetail.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)((0, portable_column_options_1.getPortableUpdateDateColumnOptions)({}, 'timestamp')),
    __metadata("design:type", Date)
], StudyDetail.prototype, "updatedAt", void 0);
exports.StudyDetail = StudyDetail = __decorate([
    (0, typeorm_1.Entity)({ name: 'study_details' })
], StudyDetail);
//# sourceMappingURL=study-detail.entity.js.map