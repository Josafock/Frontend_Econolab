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
exports.SyncOutboxEvent = exports.SyncOutboxStatus = exports.SyncOutboxOperation = void 0;
const typeorm_1 = require("typeorm");
const portable_column_options_1 = require("../../database/portable-column-options");
var SyncOutboxOperation;
(function (SyncOutboxOperation) {
    SyncOutboxOperation["UPSERT"] = "upsert";
    SyncOutboxOperation["DELETE"] = "delete";
})(SyncOutboxOperation || (exports.SyncOutboxOperation = SyncOutboxOperation = {}));
var SyncOutboxStatus;
(function (SyncOutboxStatus) {
    SyncOutboxStatus["PENDING"] = "pending";
    SyncOutboxStatus["PROCESSING"] = "processing";
    SyncOutboxStatus["SYNCED"] = "synced";
    SyncOutboxStatus["FAILED"] = "failed";
})(SyncOutboxStatus || (exports.SyncOutboxStatus = SyncOutboxStatus = {}));
let SyncOutboxEvent = class SyncOutboxEvent {
    id;
    resourceType;
    resourcePublicId;
    resourceLocalId;
    operation;
    status;
    syncVersion;
    syncOrigin;
    payload;
    attempts;
    lastError;
    availableAt;
    processedAt;
    leaseToken;
    leasedAt;
    createdAt;
    updatedAt;
};
exports.SyncOutboxEvent = SyncOutboxEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SyncOutboxEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resource_type', type: 'varchar', length: 120 }),
    __metadata("design:type", String)
], SyncOutboxEvent.prototype, "resourceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resource_public_id', type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], SyncOutboxEvent.prototype, "resourcePublicId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'resource_local_id',
        type: 'varchar',
        length: 64,
        nullable: true,
    }),
    __metadata("design:type", Object)
], SyncOutboxEvent.prototype, "resourceLocalId", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableEnumColumnOptions)(SyncOutboxOperation)),
    __metadata("design:type", String)
], SyncOutboxEvent.prototype, "operation", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableEnumColumnOptions)(SyncOutboxStatus, SyncOutboxStatus.PENDING)),
    __metadata("design:type", String)
], SyncOutboxEvent.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sync_version', type: 'int', default: 1 }),
    __metadata("design:type", Number)
], SyncOutboxEvent.prototype, "syncVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sync_origin', type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", Object)
], SyncOutboxEvent.prototype, "syncOrigin", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableJsonColumnOptions)('{}')),
    __metadata("design:type", Object)
], SyncOutboxEvent.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SyncOutboxEvent.prototype, "attempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_error', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], SyncOutboxEvent.prototype, "lastError", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableTimestampColumnOptions)({ name: 'available_at' }, 'timestamp')),
    __metadata("design:type", Date)
], SyncOutboxEvent.prototype, "availableAt", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableTimestampColumnOptions)({ name: 'processed_at', nullable: true }, 'timestamp')),
    __metadata("design:type", Object)
], SyncOutboxEvent.prototype, "processedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lease_token', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], SyncOutboxEvent.prototype, "leaseToken", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableTimestampColumnOptions)({ name: 'leased_at', nullable: true }, 'timestamp')),
    __metadata("design:type", Object)
], SyncOutboxEvent.prototype, "leasedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)((0, portable_column_options_1.getPortableCreateDateColumnOptions)({ name: 'created_at' }, 'timestamp')),
    __metadata("design:type", Date)
], SyncOutboxEvent.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)((0, portable_column_options_1.getPortableUpdateDateColumnOptions)({ name: 'updated_at' }, 'timestamp')),
    __metadata("design:type", Date)
], SyncOutboxEvent.prototype, "updatedAt", void 0);
exports.SyncOutboxEvent = SyncOutboxEvent = __decorate([
    (0, typeorm_1.Entity)({ name: 'sync_outbox_events' }),
    (0, typeorm_1.Index)('idx_sync_outbox_status_available', ['status', 'availableAt']),
    (0, typeorm_1.Index)('idx_sync_outbox_resource_pending', [
        'resourceType',
        'resourcePublicId',
        'status',
    ]),
    (0, typeorm_1.Index)('idx_sync_outbox_lease_token', ['leaseToken'])
], SyncOutboxEvent);
//# sourceMappingURL=sync-outbox-event.entity.js.map