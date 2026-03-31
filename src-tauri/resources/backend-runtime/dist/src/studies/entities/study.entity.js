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
exports.Study = exports.StudyStatus = exports.StudyType = void 0;
const typeorm_1 = require("typeorm");
const sync_metadata_entity_1 = require("../../common/entities/sync-metadata.entity");
const portable_column_options_1 = require("../../database/portable-column-options");
var StudyType;
(function (StudyType) {
    StudyType["STUDY"] = "study";
    StudyType["PACKAGE"] = "package";
    StudyType["OTHER"] = "other";
})(StudyType || (exports.StudyType = StudyType = {}));
var StudyStatus;
(function (StudyStatus) {
    StudyStatus["ACTIVE"] = "active";
    StudyStatus["SUSPENDED"] = "suspended";
})(StudyStatus || (exports.StudyStatus = StudyStatus = {}));
let Study = class Study extends sync_metadata_entity_1.SyncMetadataEntity {
    id;
    name;
    code;
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
    isActive;
    createdAt;
    updatedAt;
};
exports.Study = Study;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Study.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_studies_name'),
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], Study.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_studies_code'),
    (0, typeorm_1.Column)({ length: 50, unique: true }),
    __metadata("design:type", String)
], Study.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Study.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 60 }),
    __metadata("design:type", Number)
], Study.prototype, "durationMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableEnumColumnOptions)(StudyType, StudyType.STUDY)),
    __metadata("design:type", String)
], Study.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Study.prototype, "normalPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Study.prototype, "difPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Study.prototype, "specialPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Study.prototype, "hospitalPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Study.prototype, "otherPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Study.prototype, "defaultDiscountPercent", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150, nullable: true }),
    __metadata("design:type", String)
], Study.prototype, "method", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150, nullable: true }),
    __metadata("design:type", String)
], Study.prototype, "indicator", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableIntegerArrayColumnOptions)({ nullable: false })),
    __metadata("design:type", Array)
], Study.prototype, "packageStudyIds", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableEnumColumnOptions)(StudyStatus, StudyStatus.ACTIVE)),
    __metadata("design:type", String)
], Study.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Study.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)((0, portable_column_options_1.getPortableCreateDateColumnOptions)({}, 'timestamp')),
    __metadata("design:type", Date)
], Study.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)((0, portable_column_options_1.getPortableUpdateDateColumnOptions)({}, 'timestamp')),
    __metadata("design:type", Date)
], Study.prototype, "updatedAt", void 0);
exports.Study = Study = __decorate([
    (0, typeorm_1.Entity)({ name: 'studies' })
], Study);
//# sourceMappingURL=study.entity.js.map