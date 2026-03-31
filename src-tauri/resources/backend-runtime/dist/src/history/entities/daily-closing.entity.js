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
exports.DailyClosing = void 0;
const typeorm_1 = require("typeorm");
const portable_column_options_1 = require("../../database/portable-column-options");
let DailyClosing = class DailyClosing {
    id;
    closingDate;
    periodStart;
    periodEnd;
    servicesCount;
    patientsCount;
    studiesCount;
    subtotalAmount;
    discountAmount;
    totalAmount;
    averageTicket;
    branchBreakdown;
    topStudies;
    hourlyBreakdown;
    servicesSnapshot;
    createdAt;
    updatedAt;
};
exports.DailyClosing = DailyClosing;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DailyClosing.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], DailyClosing.prototype, "closingDate", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableTimestampColumnOptions)()),
    __metadata("design:type", Date)
], DailyClosing.prototype, "periodStart", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableTimestampColumnOptions)()),
    __metadata("design:type", Date)
], DailyClosing.prototype, "periodEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DailyClosing.prototype, "servicesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DailyClosing.prototype, "patientsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DailyClosing.prototype, "studiesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], DailyClosing.prototype, "subtotalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], DailyClosing.prototype, "discountAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], DailyClosing.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], DailyClosing.prototype, "averageTicket", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableJsonColumnOptions)()),
    __metadata("design:type", Array)
], DailyClosing.prototype, "branchBreakdown", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableJsonColumnOptions)()),
    __metadata("design:type", Array)
], DailyClosing.prototype, "topStudies", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableJsonColumnOptions)()),
    __metadata("design:type", Array)
], DailyClosing.prototype, "hourlyBreakdown", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableJsonColumnOptions)()),
    __metadata("design:type", Array)
], DailyClosing.prototype, "servicesSnapshot", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)((0, portable_column_options_1.getPortableCreateDateColumnOptions)()),
    __metadata("design:type", Date)
], DailyClosing.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)((0, portable_column_options_1.getPortableUpdateDateColumnOptions)()),
    __metadata("design:type", Date)
], DailyClosing.prototype, "updatedAt", void 0);
exports.DailyClosing = DailyClosing = __decorate([
    (0, typeorm_1.Entity)({ name: 'daily_closings' }),
    (0, typeorm_1.Index)('idx_daily_closings_closing_date', ['closingDate'], { unique: true })
], DailyClosing);
//# sourceMappingURL=daily-closing.entity.js.map