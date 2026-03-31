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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncController = void 0;
const common_1 = require("@nestjs/common");
const apply_sync_mutations_dto_1 = require("./dto/apply-sync-mutations.dto");
const claim_sync_outbox_dto_1 = require("./dto/claim-sync-outbox.dto");
const fail_sync_outbox_dto_1 = require("./dto/fail-sync-outbox.dto");
const lease_sync_outbox_dto_1 = require("./dto/lease-sync-outbox.dto");
const requeue_sync_outbox_dto_1 = require("./dto/requeue-sync-outbox.dto");
const sync_machine_auth_guard_1 = require("./guards/sync-machine-auth.guard");
const sync_inbound_service_1 = require("./sync-inbound.service");
const sync_outbox_service_1 = require("./sync-outbox.service");
let SyncController = class SyncController {
    syncOutbox;
    syncInbound;
    constructor(syncOutbox, syncInbound) {
        this.syncOutbox = syncOutbox;
        this.syncInbound = syncInbound;
    }
    getSummary() {
        return this.syncOutbox.getSummary();
    }
    async claim(dto) {
        const claimed = await this.syncOutbox.claimPendingBatch(dto.limit);
        return {
            leaseToken: claimed.leaseToken,
            count: claimed.events.length,
            events: claimed.events,
        };
    }
    async ack(dto) {
        const result = await this.syncOutbox.markAsSynced(dto.leaseToken, dto.ids);
        return {
            message: 'Eventos marcados como sincronizados.',
            affected: result.affected,
        };
    }
    async fail(dto) {
        const result = await this.syncOutbox.failBatch(dto.leaseToken, dto.failures);
        return {
            message: 'Eventos marcados como fallidos.',
            affected: result.affected,
        };
    }
    async requeue(dto) {
        const result = await this.syncOutbox.requeue(dto.ids, dto.includeProcessing ?? false);
        return {
            message: 'Eventos reencolados correctamente.',
            affected: result.affected,
        };
    }
    async requeueFailedAll() {
        const result = await this.syncOutbox.requeueAllFailed();
        return {
            message: 'Eventos fallidos reencolados correctamente.',
            affected: result.affected,
        };
    }
    async discardFailedAll() {
        const result = await this.syncOutbox.discardAllFailed();
        return {
            message: 'Eventos fallidos descartados correctamente.',
            affected: result.affected,
        };
    }
    applyInbound(dto) {
        return this.syncInbound.applyBatch(dto.mutations);
    }
};
exports.SyncController = SyncController;
__decorate([
    (0, common_1.Get)('summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SyncController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Post)('claim'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [claim_sync_outbox_dto_1.ClaimSyncOutboxDto]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "claim", null);
__decorate([
    (0, common_1.Post)('ack'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [lease_sync_outbox_dto_1.LeaseSyncOutboxDto]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "ack", null);
__decorate([
    (0, common_1.Post)('fail'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fail_sync_outbox_dto_1.FailSyncOutboxDto]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "fail", null);
__decorate([
    (0, common_1.Post)('requeue'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [requeue_sync_outbox_dto_1.RequeueSyncOutboxDto]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "requeue", null);
__decorate([
    (0, common_1.Post)('requeue-failed-all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "requeueFailedAll", null);
__decorate([
    (0, common_1.Post)('discard-failed-all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "discardFailedAll", null);
__decorate([
    (0, common_1.Post)('inbound/apply'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [apply_sync_mutations_dto_1.ApplySyncMutationsDto]),
    __metadata("design:returntype", void 0)
], SyncController.prototype, "applyInbound", null);
exports.SyncController = SyncController = __decorate([
    (0, common_1.UseGuards)(sync_machine_auth_guard_1.SyncMachineAuthGuard),
    (0, common_1.Controller)('sync/outbox'),
    __metadata("design:paramtypes", [sync_outbox_service_1.SyncOutboxService,
        sync_inbound_service_1.SyncInboundService])
], SyncController);
//# sourceMappingURL=sync.controller.js.map