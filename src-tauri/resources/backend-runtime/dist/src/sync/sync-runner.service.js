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
var SyncRunnerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncRunnerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("typeorm");
const sync_remote_client_service_1 = require("./sync-remote-client.service");
const sync_bootstrap_service_1 = require("./sync-bootstrap.service");
const sync_inbound_service_1 = require("./sync-inbound.service");
const sync_outbox_service_1 = require("./sync-outbox.service");
const sync_resource_util_1 = require("./sync-resource.util");
function isSuccessfulApplyStatus(status) {
    return ['applied', 'skipped_stale', 'skipped_duplicate'].includes(status);
}
let SyncRunnerService = SyncRunnerService_1 = class SyncRunnerService {
    configService;
    dataSource;
    syncOutbox;
    syncInbound;
    syncBootstrap;
    syncRemoteClient;
    logger = new common_1.Logger(SyncRunnerService_1.name);
    autoInterval = null;
    startupTimer = null;
    startupSyncPromise = null;
    attemptedEmptyBootstrapResources = new Set();
    running = false;
    lastRunAt = null;
    lastRunResult = null;
    constructor(configService, dataSource, syncOutbox, syncInbound, syncBootstrap, syncRemoteClient) {
        this.configService = configService;
        this.dataSource = dataSource;
        this.syncOutbox = syncOutbox;
        this.syncInbound = syncInbound;
        this.syncBootstrap = syncBootstrap;
        this.syncRemoteClient = syncRemoteClient;
    }
    get runtimeConfig() {
        return this.configService.getOrThrow('sync');
    }
    get autoSyncEnabled() {
        return this.runtimeConfig.autoEnabled && Boolean(this.runtimeConfig.remoteBaseUrl);
    }
    get startupSyncEnabled() {
        return Boolean(this.runtimeConfig.remoteBaseUrl);
    }
    startStartupSync() {
        if (this.startupSyncPromise) {
            return this.startupSyncPromise;
        }
        this.startupSyncPromise = this.runStartupSync()
            .catch((error) => {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`La sincronizacion inicial fallo: ${message}`);
        })
            .finally(() => {
            this.startupSyncPromise = null;
        });
        return this.startupSyncPromise;
    }
    onModuleInit() {
        if (!this.startupSyncEnabled) {
            return;
        }
        this.startupTimer = setTimeout(() => {
            void this.startStartupSync();
        }, 250);
        if (!this.autoSyncEnabled) {
            return;
        }
        const intervalMs = Math.max(5, this.runtimeConfig.autoIntervalSeconds) * 1000;
        this.autoInterval = setInterval(() => {
            void this.runOnce({
                reason: 'interval',
            }).catch((error) => {
                const message = error instanceof Error ? error.message : String(error);
                this.logger.warn(`La sincronizacion automatica fallo: ${message}`);
            });
        }, intervalMs);
    }
    onModuleDestroy() {
        if (this.startupTimer) {
            clearTimeout(this.startupTimer);
            this.startupTimer = null;
        }
        if (this.autoInterval) {
            clearInterval(this.autoInterval);
            this.autoInterval = null;
        }
    }
    getStatus() {
        return {
            running: this.running,
            autoEnabled: this.autoSyncEnabled,
            startupEnabled: this.startupSyncEnabled,
            remoteBaseUrlConfigured: Boolean(this.runtimeConfig.remoteBaseUrl),
            autoIntervalSeconds: this.runtimeConfig.autoIntervalSeconds,
            lastRunAt: this.lastRunAt,
            lastRunResult: this.lastRunResult,
        };
    }
    async getLocalResourceCounts() {
        const counts = {};
        for (const resourceType of sync_resource_util_1.SUPPORTED_INBOUND_SYNC_RESOURCES) {
            const entity = (0, sync_resource_util_1.getSyncTrackedResourceEntity)(resourceType);
            if (!entity) {
                counts[resourceType] = 0;
                continue;
            }
            counts[resourceType] = await this.dataSource.getRepository(entity).count();
        }
        return counts;
    }
    async resolveBootstrapResourceTypes() {
        const counts = await this.getLocalResourceCounts();
        return sync_resource_util_1.SUPPORTED_INBOUND_SYNC_RESOURCES.filter((resourceType) => counts[resourceType] === 0 &&
            !this.attemptedEmptyBootstrapResources.has(resourceType));
    }
    async runStartupSync() {
        const bootstrapResourceTypes = await this.resolveBootstrapResourceTypes();
        let bootstrapResult;
        if (bootstrapResourceTypes.length > 0) {
            try {
                const result = await this.bootstrapFromRemote({
                    resourceTypes: bootstrapResourceTypes,
                    includeDeleted: true,
                });
                bootstrapResult = {
                    status: 'completed',
                    resourceTypes: bootstrapResourceTypes,
                    ...result,
                };
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                const result = {
                    status: 'bootstrap_failed',
                    reason: 'startup',
                    remoteBaseUrl: this.runtimeConfig.remoteBaseUrl,
                    bootstrap: {
                        status: 'failed',
                        resourceTypes: bootstrapResourceTypes,
                        message,
                    },
                    sync: null,
                };
                this.lastRunAt = new Date().toISOString();
                this.lastRunResult = result;
                return result;
            }
        }
        else {
            bootstrapResult = {
                status: 'skipped',
                resourceTypes: [],
            };
        }
        const syncResult = await this.runOnce({
            reason: 'startup',
        });
        const result = {
            status: 'startup_completed',
            reason: 'startup',
            remoteBaseUrl: this.runtimeConfig.remoteBaseUrl,
            bootstrap: bootstrapResult,
            sync: syncResult,
        };
        this.lastRunAt = new Date().toISOString();
        this.lastRunResult = result;
        return result;
    }
    getSyncFailureMessage(result) {
        const message = typeof result?.message === 'string'
            ? result.message
            : null;
        if (message) {
            return message;
        }
        const pullError = typeof result?.pull?.error ===
            'string'
            ? (result.pull?.error ?? null)
            : null;
        if (pullError) {
            return pullError;
        }
        const pushError = typeof result?.push?.error ===
            'string'
            ? (result.push?.error ?? null)
            : null;
        return pushError;
    }
    async bootstrapFromRemote(options) {
        if (!this.runtimeConfig.remoteBaseUrl) {
            throw new Error('SYNC_REMOTE_BASE_URL no esta configurado. No se puede hacer bootstrap remoto.');
        }
        const resourceTypes = (options?.resourceTypes?.length
            ? options.resourceTypes
            : [...sync_resource_util_1.SUPPORTED_INBOUND_SYNC_RESOURCES]).filter((resourceType) => sync_resource_util_1.SUPPORTED_INBOUND_SYNC_RESOURCES.includes(resourceType));
        const summary = [];
        for (const resourceType of resourceTypes) {
            let cursor;
            let pages = 0;
            let exported = 0;
            let applied = 0;
            let skipped = 0;
            let deferred = 0;
            let failed = 0;
            do {
                const page = await this.syncRemoteClient.exportBootstrapPage({
                    resourceType,
                    cursor,
                    limit: options?.limit,
                    includeDeleted: options?.includeDeleted,
                });
                pages += 1;
                exported += page.count;
                if (page.mutations.length > 0) {
                    const applyResult = await this.syncInbound.applyBatch(page.mutations);
                    applied += applyResult.appliedCount;
                    skipped += applyResult.skippedCount;
                    deferred += applyResult.deferredCount;
                    failed += applyResult.failedCount;
                }
                cursor = page.hasMore && page.nextCursor ? page.nextCursor : undefined;
            } while (cursor);
            summary.push({
                resourceType,
                exported,
                applied,
                skipped,
                deferred,
                failed,
                pages,
            });
        }
        resourceTypes.forEach((resourceType) => {
            this.attemptedEmptyBootstrapResources.add(resourceType);
        });
        return {
            remoteBaseUrl: this.runtimeConfig.remoteBaseUrl,
            resources: summary,
            totals: {
                exported: summary.reduce((acc, item) => acc + item.exported, 0),
                applied: summary.reduce((acc, item) => acc + item.applied, 0),
                skipped: summary.reduce((acc, item) => acc + item.skipped, 0),
                deferred: summary.reduce((acc, item) => acc + item.deferred, 0),
                failed: summary.reduce((acc, item) => acc + item.failed, 0),
            },
        };
    }
    async ensureDesktopDataReady() {
        if (!this.runtimeConfig.remoteBaseUrl) {
            return {
                status: 'skipped_not_configured',
                resourceTypes: [],
                sync: null,
            };
        }
        if (this.startupTimer) {
            clearTimeout(this.startupTimer);
            this.startupTimer = null;
        }
        if (this.startupSyncPromise) {
            await this.startupSyncPromise;
        }
        const bootstrapResourceTypes = await this.resolveBootstrapResourceTypes();
        const bootstrap = bootstrapResourceTypes.length > 0
            ? await this.bootstrapFromRemote({
                resourceTypes: bootstrapResourceTypes,
                includeDeleted: true,
            })
            : null;
        const sync = await this.runOnce({
            reason: 'login',
        });
        if (bootstrapResourceTypes.length > 0 && sync.status !== 'completed') {
            throw new Error(this.getSyncFailureMessage(sync) ??
                'No se pudo completar la sincronizacion inicial del escritorio.');
        }
        return {
            status: bootstrapResourceTypes.length > 0
                ? 'completed'
                : 'up_to_date',
            resourceTypes: bootstrapResourceTypes,
            bootstrap,
            sync,
        };
    }
    async runOnce(options) {
        if (!this.runtimeConfig.remoteBaseUrl) {
            const result = {
                status: 'skipped_not_configured',
                message: 'SYNC_REMOTE_BASE_URL no esta configurado. No se puede correr sincronizacion remota.',
            };
            this.lastRunAt = new Date().toISOString();
            this.lastRunResult = result;
            return result;
        }
        if (this.running) {
            return {
                status: 'skipped_already_running',
                message: 'Ya hay una sincronizacion en curso.',
            };
        }
        this.running = true;
        let pushResult;
        let pullResult;
        const reason = options?.reason ?? 'manual';
        try {
            if (reason === 'manual') {
                await this.syncOutbox.requeueAllFailed();
            }
            else {
                await this.syncOutbox.requeueFailedReady();
            }
            pushResult = await this.pushPendingBatch(options?.pushLimit);
            pullResult = await this.pullPendingBatch(options?.pullLimit);
            const result = {
                status: 'completed',
                reason,
                remoteBaseUrl: this.runtimeConfig.remoteBaseUrl,
                push: pushResult,
                pull: pullResult,
            };
            this.lastRunAt = new Date().toISOString();
            this.lastRunResult = result;
            return result;
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'No se pudo completar la sincronizacion remota.';
            const result = {
                status: 'failed',
                reason,
                remoteBaseUrl: this.runtimeConfig.remoteBaseUrl,
                push: pushResult,
                pull: pullResult,
                message,
            };
            this.lastRunAt = new Date().toISOString();
            this.lastRunResult = result;
            return result;
        }
        finally {
            this.running = false;
        }
    }
    async pushPendingBatch(limit) {
        const claimed = await this.syncOutbox.claimPendingBatch(limit);
        if (!claimed.leaseToken || claimed.events.length === 0) {
            return {
                claimed: 0,
                synced: 0,
                failed: 0,
            };
        }
        try {
            const mutations = claimed.events.map((event) => ({
                resourceType: event.resourceType,
                operation: event.operation,
                payload: event.payload,
            }));
            const remoteApplyResult = await this.syncRemoteClient.applyInbound(mutations);
            const successfulIds = [];
            const failures = [];
            for (const result of remoteApplyResult.results) {
                const event = claimed.events[result.index];
                if (!event) {
                    continue;
                }
                if (isSuccessfulApplyStatus(result.status)) {
                    successfulIds.push(event.id);
                    continue;
                }
                failures.push({
                    id: event.id,
                    error: result.message,
                });
            }
            if (successfulIds.length > 0) {
                await this.syncOutbox.markAsSynced(claimed.leaseToken, successfulIds);
            }
            if (failures.length > 0) {
                await this.syncOutbox.failBatch(claimed.leaseToken, failures);
            }
            return {
                claimed: claimed.events.length,
                synced: successfulIds.length,
                failed: failures.length,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo enviar el lote remoto.';
            await this.syncOutbox.failBatch(claimed.leaseToken, claimed.events.map((event) => ({
                id: event.id,
                error: message,
            })));
            return {
                claimed: claimed.events.length,
                synced: 0,
                failed: claimed.events.length,
                error: message,
            };
        }
    }
    async pullPendingBatch(limit) {
        const claimed = await this.syncRemoteClient.claimPendingBatch(limit);
        if (!claimed.leaseToken || claimed.events.length === 0) {
            return {
                claimed: 0,
                synced: 0,
                failed: 0,
            };
        }
        try {
            const mutations = claimed.events.map((event) => ({
                resourceType: event.resourceType,
                operation: event.operation,
                payload: event.payload,
            }));
            const localApplyResult = await this.syncInbound.applyBatch(mutations);
            const successfulIds = [];
            const failures = [];
            for (const result of localApplyResult.results) {
                const event = claimed.events[result.index];
                if (!event) {
                    continue;
                }
                if (isSuccessfulApplyStatus(result.status)) {
                    successfulIds.push(event.id);
                    continue;
                }
                failures.push({
                    id: event.id,
                    error: result.message,
                });
            }
            if (successfulIds.length > 0) {
                await this.syncRemoteClient.ackBatch(claimed.leaseToken, successfulIds);
            }
            if (failures.length > 0) {
                await this.syncRemoteClient.failBatch(claimed.leaseToken, failures);
            }
            return {
                claimed: claimed.events.length,
                synced: successfulIds.length,
                failed: failures.length,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo aplicar el lote remoto.';
            await this.syncRemoteClient.failBatch(claimed.leaseToken, claimed.events.map((event) => ({
                id: event.id,
                error: message,
            })));
            return {
                claimed: claimed.events.length,
                synced: 0,
                failed: claimed.events.length,
                error: message,
            };
        }
    }
};
exports.SyncRunnerService = SyncRunnerService;
exports.SyncRunnerService = SyncRunnerService = SyncRunnerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_1.DataSource,
        sync_outbox_service_1.SyncOutboxService,
        sync_inbound_service_1.SyncInboundService,
        sync_bootstrap_service_1.SyncBootstrapService,
        sync_remote_client_service_1.SyncRemoteClientService])
], SyncRunnerService);
//# sourceMappingURL=sync-runner.service.js.map