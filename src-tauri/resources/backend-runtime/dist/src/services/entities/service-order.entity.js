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
exports.ServiceItemPriceType = exports.ServiceOrderItem = exports.ServiceOrder = exports.ServiceStatus = void 0;
const typeorm_1 = require("typeorm");
const patient_entity_1 = require("../../patients/entities/patient.entity");
const doctor_entity_1 = require("../../doctors/entities/doctor.entity");
const sync_metadata_entity_1 = require("../../common/entities/sync-metadata.entity");
const portable_column_options_1 = require("../../database/portable-column-options");
var ServiceStatus;
(function (ServiceStatus) {
    ServiceStatus["PENDING"] = "pending";
    ServiceStatus["IN_PROGRESS"] = "in_progress";
    ServiceStatus["DELAYED"] = "delayed";
    ServiceStatus["COMPLETED"] = "completed";
    ServiceStatus["CANCELLED"] = "cancelled";
})(ServiceStatus || (exports.ServiceStatus = ServiceStatus = {}));
let ServiceOrder = class ServiceOrder extends sync_metadata_entity_1.SyncMetadataEntity {
    id;
    folio;
    patient;
    patientId;
    doctor;
    doctorId;
    branchName;
    sampleAt;
    deliveryAt;
    completedAt;
    status;
    subtotalAmount;
    courtesyPercent;
    discountAmount;
    totalAmount;
    notes;
    isActive;
    items;
    createdAt;
    updatedAt;
};
exports.ServiceOrder = ServiceOrder;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ServiceOrder.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_services_folio'),
    (0, typeorm_1.Column)({ length: 50, unique: true }),
    __metadata("design:type", String)
], ServiceOrder.prototype, "folio", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => patient_entity_1.Patient, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'patient_id' }),
    __metadata("design:type", patient_entity_1.Patient)
], ServiceOrder.prototype, "patient", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'patient_id' }),
    __metadata("design:type", Number)
], ServiceOrder.prototype, "patientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => doctor_entity_1.Doctor, { eager: true, nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'doctor_id' }),
    __metadata("design:type", doctor_entity_1.Doctor)
], ServiceOrder.prototype, "doctor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'doctor_id', nullable: true }),
    __metadata("design:type", Number)
], ServiceOrder.prototype, "doctorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150, nullable: true }),
    __metadata("design:type", String)
], ServiceOrder.prototype, "branchName", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableTimestampColumnOptions)({ nullable: true })),
    __metadata("design:type", Date)
], ServiceOrder.prototype, "sampleAt", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableTimestampColumnOptions)({ nullable: true })),
    __metadata("design:type", Date)
], ServiceOrder.prototype, "deliveryAt", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableTimestampColumnOptions)({ nullable: true })),
    __metadata("design:type", Date)
], ServiceOrder.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableEnumColumnOptions)(ServiceStatus, ServiceStatus.PENDING)),
    __metadata("design:type", String)
], ServiceOrder.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ServiceOrder.prototype, "subtotalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ServiceOrder.prototype, "courtesyPercent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ServiceOrder.prototype, "discountAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ServiceOrder.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ServiceOrder.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ServiceOrder.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ServiceOrderItem, (item) => item.serviceOrder, {
        cascade: true,
        eager: true,
    }),
    __metadata("design:type", Array)
], ServiceOrder.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)((0, portable_column_options_1.getPortableCreateDateColumnOptions)()),
    __metadata("design:type", Date)
], ServiceOrder.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)((0, portable_column_options_1.getPortableUpdateDateColumnOptions)()),
    __metadata("design:type", Date)
], ServiceOrder.prototype, "updatedAt", void 0);
exports.ServiceOrder = ServiceOrder = __decorate([
    (0, typeorm_1.Entity)({ name: 'service_orders' }),
    (0, typeorm_1.Index)('idx_service_order_patient', ['patientId']),
    (0, typeorm_1.Index)('idx_service_order_doctor', ['doctorId']),
    (0, typeorm_1.Index)('idx_service_order_status', ['status']),
    (0, typeorm_1.Index)('idx_service_order_created_at', ['createdAt'])
], ServiceOrder);
let ServiceOrderItem = class ServiceOrderItem extends sync_metadata_entity_1.SyncMetadataEntity {
    id;
    serviceOrder;
    serviceOrderId;
    studyId;
    studyNameSnapshot;
    sourcePackageId;
    sourcePackageNameSnapshot;
    priceType;
    unitPrice;
    quantity;
    discountPercent;
    subtotalAmount;
};
exports.ServiceOrderItem = ServiceOrderItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ServiceOrderItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ServiceOrder, (order) => order.items, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'service_order_id' }),
    __metadata("design:type", ServiceOrder)
], ServiceOrderItem.prototype, "serviceOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'service_order_id' }),
    __metadata("design:type", Number)
], ServiceOrderItem.prototype, "serviceOrderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'study_id' }),
    __metadata("design:type", Number)
], ServiceOrderItem.prototype, "studyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], ServiceOrderItem.prototype, "studyNameSnapshot", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_package_id', nullable: true }),
    __metadata("design:type", Number)
], ServiceOrderItem.prototype, "sourcePackageId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_package_name_snapshot', length: 200, nullable: true }),
    __metadata("design:type", String)
], ServiceOrderItem.prototype, "sourcePackageNameSnapshot", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], ServiceOrderItem.prototype, "priceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ServiceOrderItem.prototype, "unitPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], ServiceOrderItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ServiceOrderItem.prototype, "discountPercent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ServiceOrderItem.prototype, "subtotalAmount", void 0);
exports.ServiceOrderItem = ServiceOrderItem = __decorate([
    (0, typeorm_1.Entity)({ name: 'service_order_items' })
], ServiceOrderItem);
var ServiceItemPriceType;
(function (ServiceItemPriceType) {
    ServiceItemPriceType["NORMAL"] = "normal";
    ServiceItemPriceType["DIF"] = "dif";
    ServiceItemPriceType["SPECIAL"] = "special";
    ServiceItemPriceType["HOSPITAL"] = "hospital";
    ServiceItemPriceType["OTHER"] = "other";
})(ServiceItemPriceType || (exports.ServiceItemPriceType = ServiceItemPriceType = {}));
//# sourceMappingURL=service-order.entity.js.map