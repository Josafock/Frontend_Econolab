"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const sync_outbox_event_entity_1 = require("./entities/sync-outbox-event.entity");
const sync_machine_auth_guard_1 = require("./guards/sync-machine-auth.guard");
const sync_management_controller_1 = require("./sync-management.controller");
const sync_bootstrap_service_1 = require("./sync-bootstrap.service");
const sync_inbound_service_1 = require("./sync-inbound.service");
const sync_controller_1 = require("./sync.controller");
const sync_outbox_service_1 = require("./sync-outbox.service");
const sync_remote_client_service_1 = require("./sync-remote-client.service");
const sync_runner_service_1 = require("./sync-runner.service");
let SyncModule = class SyncModule {
};
exports.SyncModule = SyncModule;
exports.SyncModule = SyncModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([sync_outbox_event_entity_1.SyncOutboxEvent])],
        providers: [
            sync_outbox_service_1.SyncOutboxService,
            sync_inbound_service_1.SyncInboundService,
            sync_machine_auth_guard_1.SyncMachineAuthGuard,
            sync_bootstrap_service_1.SyncBootstrapService,
            sync_remote_client_service_1.SyncRemoteClientService,
            sync_runner_service_1.SyncRunnerService,
        ],
        controllers: [sync_controller_1.SyncController, sync_management_controller_1.SyncManagementController],
        exports: [
            sync_outbox_service_1.SyncOutboxService,
            sync_inbound_service_1.SyncInboundService,
            sync_bootstrap_service_1.SyncBootstrapService,
            sync_runner_service_1.SyncRunnerService,
        ],
    })
], SyncModule);
//# sourceMappingURL=sync.module.js.map