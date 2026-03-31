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
exports.SyncManagementController = void 0;
const common_1 = require("@nestjs/common");
const sync_machine_auth_guard_1 = require("./guards/sync-machine-auth.guard");
const export_sync_bootstrap_dto_1 = require("./dto/export-sync-bootstrap.dto");
const pull_sync_bootstrap_dto_1 = require("./dto/pull-sync-bootstrap.dto");
const run_sync_cycle_dto_1 = require("./dto/run-sync-cycle.dto");
const sync_bootstrap_service_1 = require("./sync-bootstrap.service");
const sync_runner_service_1 = require("./sync-runner.service");
let SyncManagementController = class SyncManagementController {
    syncBootstrap;
    syncRunner;
    constructor(syncBootstrap, syncRunner) {
        this.syncBootstrap = syncBootstrap;
        this.syncRunner = syncRunner;
    }
    getStatus() {
        return this.syncRunner.getStatus();
    }
    runOnce(dto) {
        return this.syncRunner.runOnce({
            pushLimit: dto.pushLimit,
            pullLimit: dto.pullLimit,
            reason: 'manual',
        });
    }
    exportBootstrap(dto) {
        return this.syncBootstrap.exportResourcePage(dto.resourceType, {
            cursor: dto.cursor,
            limit: dto.limit,
            includeDeleted: dto.includeDeleted,
        });
    }
    pullBootstrap(dto) {
        return this.syncRunner.bootstrapFromRemote({
            resourceTypes: dto.resourceTypes,
            limit: dto.limit,
            includeDeleted: dto.includeDeleted,
        });
    }
};
exports.SyncManagementController = SyncManagementController;
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SyncManagementController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('run'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [run_sync_cycle_dto_1.RunSyncCycleDto]),
    __metadata("design:returntype", void 0)
], SyncManagementController.prototype, "runOnce", null);
__decorate([
    (0, common_1.Post)('bootstrap/export'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [export_sync_bootstrap_dto_1.ExportSyncBootstrapDto]),
    __metadata("design:returntype", void 0)
], SyncManagementController.prototype, "exportBootstrap", null);
__decorate([
    (0, common_1.Post)('bootstrap/pull'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pull_sync_bootstrap_dto_1.PullSyncBootstrapDto]),
    __metadata("design:returntype", void 0)
], SyncManagementController.prototype, "pullBootstrap", null);
exports.SyncManagementController = SyncManagementController = __decorate([
    (0, common_1.UseGuards)(sync_machine_auth_guard_1.SyncMachineAuthGuard),
    (0, common_1.Controller)('sync'),
    __metadata("design:paramtypes", [sync_bootstrap_service_1.SyncBootstrapService,
        sync_runner_service_1.SyncRunnerService])
], SyncManagementController);
//# sourceMappingURL=sync-management.controller.js.map