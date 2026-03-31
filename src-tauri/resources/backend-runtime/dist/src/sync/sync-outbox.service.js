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
exports.SyncOutboxService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_crypto_1 = require("node:crypto");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sync_outbox_event_entity_1 = require("./entities/sync-outbox-event.entity");
const sync_resource_util_1 = require("./sync-resource.util");
const sync_entity_util_1 = require("./sync-entity.util");
let SyncOutboxService = class SyncOutboxService {
    outboxRepo;
    configService;
    dataSource;
    constructor(outboxRepo, configService, dataSource) {
        this.outboxRepo = outboxRepo;
        this.configService = configService;
        this.dataSource = dataSource;
    }
    get runtimeConfig() {
        return this.configService.getOrThrow('sync');
    }
    get outboxEnabled() {
        return this.runtimeConfig.outboxEnabled;
    }
    normalizeBatchSize(limit) {
        const requested = Number(limit ?? this.runtimeConfig.outboxBatchSize);
        if (!Number.isFinite(requested) || requested < 1) {
            return 1;
        }
        return Math.min(Math.trunc(requested), 500);
    }
    async listPending(limit = this.runtimeConfig.outboxBatchSize) {
        return this.outboxRepo.find({
            where: {
                status: sync_outbox_event_entity_1.SyncOutboxStatus.PENDING,
                availableAt: (0, typeorm_2.LessThanOrEqual)(new Date()),
            },
            order: {
                availableAt: 'ASC',
                id: 'ASC',
            },
            take: Math.max(1, limit),
        });
    }
    async getSummary() {
        const [pending, processing, failed, synced] = await Promise.all([
            this.outboxRepo.count({
                where: {
                    status: sync_outbox_event_entity_1.SyncOutboxStatus.PENDING,
                    availableAt: (0, typeorm_2.LessThanOrEqual)(new Date()),
                },
            }),
            this.outboxRepo.count({
                where: { status: sync_outbox_event_entity_1.SyncOutboxStatus.PROCESSING },
            }),
            this.outboxRepo.count({
                where: { status: sync_outbox_event_entity_1.SyncOutboxStatus.FAILED },
            }),
            this.outboxRepo.count({
                where: { status: sync_outbox_event_entity_1.SyncOutboxStatus.SYNCED },
            }),
        ]);
        const nextAvailable = await this.outboxRepo.findOne({
            where: {
                status: sync_outbox_event_entity_1.SyncOutboxStatus.PENDING,
                availableAt: (0, typeorm_2.LessThanOrEqual)(new Date()),
            },
            order: {
                availableAt: 'ASC',
                id: 'ASC',
            },
        });
        return {
            outboxEnabled: this.outboxEnabled,
            counts: {
                pending,
                processing,
                failed,
                synced,
            },
            nextAvailableAt: nextAvailable?.availableAt ?? null,
            resources: await this.getResourceSyncSummary(),
        };
    }
    async claimPendingBatch(limit) {
        const batchSize = this.normalizeBatchSize(limit);
        const leaseToken = (0, node_crypto_1.randomUUID)();
        const now = new Date();
        return this.outboxRepo.manager.transaction(async (manager) => {
            const repo = manager.getRepository(sync_outbox_event_entity_1.SyncOutboxEvent);
            const candidates = await repo.find({
                select: {
                    id: true,
                },
                where: {
                    status: sync_outbox_event_entity_1.SyncOutboxStatus.PENDING,
                    availableAt: (0, typeorm_2.LessThanOrEqual)(now),
                },
                order: {
                    availableAt: 'ASC',
                    id: 'ASC',
                },
                take: batchSize,
            });
            const ids = candidates.map((candidate) => candidate.id);
            if (ids.length === 0) {
                return {
                    leaseToken: null,
                    events: [],
                };
            }
            await repo
                .createQueryBuilder()
                .update(sync_outbox_event_entity_1.SyncOutboxEvent)
                .set({
                status: sync_outbox_event_entity_1.SyncOutboxStatus.PROCESSING,
                lastError: null,
                leaseToken,
                leasedAt: now,
            })
                .where('id IN (:...ids)', { ids })
                .andWhere('status = :status', { status: sync_outbox_event_entity_1.SyncOutboxStatus.PENDING })
                .execute();
            const events = await repo.find({
                where: {
                    leaseToken,
                    status: sync_outbox_event_entity_1.SyncOutboxStatus.PROCESSING,
                },
                order: {
                    availableAt: 'ASC',
                    id: 'ASC',
                },
            });
            return {
                leaseToken: events.length > 0 ? leaseToken : null,
                events,
            };
        });
    }
    buildLeaseWhere(leaseToken, ids, statuses = [sync_outbox_event_entity_1.SyncOutboxStatus.PROCESSING]) {
        return {
            leaseToken,
            status: (0, typeorm_2.In)(statuses),
            ...(ids && ids.length > 0 ? { id: (0, typeorm_2.In)(ids) } : {}),
        };
    }
    async markAsSynced(leaseToken, ids) {
        if (!leaseToken) {
            return { affected: 0 };
        }
        return this.outboxRepo.manager.transaction(async (manager) => this.withSyncSuppressed(manager, async () => {
            const repo = manager.getRepository(sync_outbox_event_entity_1.SyncOutboxEvent);
            const claimedEvents = await repo.find({
                where: this.buildLeaseWhere(leaseToken, ids),
                order: {
                    id: 'ASC',
                },
            });
            if (claimedEvents.length === 0) {
                return { affected: 0 };
            }
            const processedAt = new Date();
            const result = await repo.update(this.buildLeaseWhere(leaseToken, ids), {
                status: sync_outbox_event_entity_1.SyncOutboxStatus.SYNCED,
                processedAt,
                lastError: null,
                leaseToken: null,
                leasedAt: null,
            });
            await this.markEntitiesAsSynced(manager, claimedEvents, processedAt);
            return {
                affected: result.affected ?? 0,
            };
        }));
    }
    async markAsFailed(leaseToken, id, errorMessage) {
        if (!leaseToken) {
            return;
        }
        const nextAttemptAt = new Date(Date.now() + this.runtimeConfig.retryDelaySeconds * 1000);
        await this.outboxRepo.increment(this.buildLeaseWhere(leaseToken, [id]), 'attempts', 1);
        await this.outboxRepo.update(this.buildLeaseWhere(leaseToken, [id]), {
            status: sync_outbox_event_entity_1.SyncOutboxStatus.FAILED,
            lastError: errorMessage,
            availableAt: nextAttemptAt,
            leaseToken: null,
            leasedAt: null,
        });
    }
    async requeue(ids, includeProcessing = false) {
        if (ids.length === 0) {
            return { affected: 0 };
        }
        const result = await this.outboxRepo.update({
            id: (0, typeorm_2.In)(ids),
            status: (0, typeorm_2.In)(includeProcessing
                ? [sync_outbox_event_entity_1.SyncOutboxStatus.FAILED, sync_outbox_event_entity_1.SyncOutboxStatus.PROCESSING]
                : [sync_outbox_event_entity_1.SyncOutboxStatus.FAILED]),
        }, {
            status: sync_outbox_event_entity_1.SyncOutboxStatus.PENDING,
            lastError: null,
            availableAt: new Date(),
            leaseToken: null,
            leasedAt: null,
            processedAt: null,
        });
        return {
            affected: result.affected ?? 0,
        };
    }
    async requeueAllFailed() {
        const result = await this.outboxRepo.update({
            status: sync_outbox_event_entity_1.SyncOutboxStatus.FAILED,
        }, {
            status: sync_outbox_event_entity_1.SyncOutboxStatus.PENDING,
            lastError: null,
            availableAt: new Date(),
            leaseToken: null,
            leasedAt: null,
            processedAt: null,
        });
        return {
            affected: result.affected ?? 0,
        };
    }
    async discardAllFailed() {
        const result = await this.outboxRepo.delete({
            status: sync_outbox_event_entity_1.SyncOutboxStatus.FAILED,
        });
        return {
            affected: result.affected ?? 0,
        };
    }
    async requeueFailedReady() {
        const result = await this.outboxRepo.update({
            status: sync_outbox_event_entity_1.SyncOutboxStatus.FAILED,
            availableAt: (0, typeorm_2.LessThanOrEqual)(new Date()),
        }, {
            status: sync_outbox_event_entity_1.SyncOutboxStatus.PENDING,
            lastError: null,
            leaseToken: null,
            leasedAt: null,
            processedAt: null,
        });
        return {
            affected: result.affected ?? 0,
        };
    }
    async failBatch(leaseToken, failures) {
        for (const failure of failures) {
            await this.markAsFailed(leaseToken, failure.id, failure.error);
        }
        return {
            affected: failures.length,
        };
    }
    async withSyncSuppressed(manager, work) {
        const queryRunner = manager.queryRunner;
        if (!queryRunner) {
            return work();
        }
        const currentData = typeof queryRunner.data === 'object' && queryRunner.data !== null
            ? queryRunner.data
            : {};
        const previousFlag = currentData[sync_entity_util_1.SYNC_OUTBOX_SKIP_FLAG];
        currentData[sync_entity_util_1.SYNC_OUTBOX_SKIP_FLAG] = true;
        queryRunner.data = currentData;
        try {
            return await work();
        }
        finally {
            if (previousFlag === undefined) {
                delete currentData[sync_entity_util_1.SYNC_OUTBOX_SKIP_FLAG];
            }
            else {
                currentData[sync_entity_util_1.SYNC_OUTBOX_SKIP_FLAG] = previousFlag;
            }
            queryRunner.data = currentData;
        }
    }
    async markEntitiesAsSynced(manager, events, processedAt) {
        const latestEventsByResource = new Map();
        for (const event of events) {
            const key = `${event.resourceType}:${event.resourcePublicId}`;
            const previous = latestEventsByResource.get(key);
            if (!previous || previous.syncVersion < event.syncVersion) {
                latestEventsByResource.set(key, {
                    resourceType: event.resourceType,
                    resourcePublicId: event.resourcePublicId,
                    syncVersion: event.syncVersion,
                });
            }
        }
        for (const latestEvent of latestEventsByResource.values()) {
            const entity = (0, sync_resource_util_1.getSyncTrackedResourceEntity)(latestEvent.resourceType);
            if (!entity) {
                continue;
            }
            const repo = manager.getRepository(entity);
            const record = await repo.findOne({
                where: { publicId: latestEvent.resourcePublicId },
            });
            if (!record) {
                continue;
            }
            const currentLastSyncedVersion = Math.max(0, Number(record.lastSyncedVersion ?? 0));
            const nextLastSyncedVersion = Math.max(currentLastSyncedVersion, latestEvent.syncVersion);
            if (nextLastSyncedVersion === currentLastSyncedVersion &&
                record.lastSyncedAt != null) {
                continue;
            }
            await repo.update({ id: record.id }, {
                lastSyncedVersion: nextLastSyncedVersion,
                lastSyncedAt: processedAt,
            });
        }
    }
    async getResourceSyncSummary() {
        const entries = Object.entries(sync_resource_util_1.SYNC_TRACKED_RESOURCE_ENTITY_MAP);
        const resourceStates = await Promise.all(entries.map(async ([resourceType, entity]) => {
            const repo = this.dataSource.getRepository(entity);
            const [total, pendingSyncRows] = await Promise.all([
                repo.count(),
                repo.query(`SELECT COUNT(*) AS count
             FROM "${repo.metadata.tableName}"
             WHERE "sync_version" > COALESCE("last_synced_version", 0)`),
            ]);
            return [
                resourceType,
                {
                    total,
                    pendingSync: Number(pendingSyncRows[0]?.count ?? 0),
                },
            ];
        }));
        return Object.fromEntries(resourceStates);
    }
};
exports.SyncOutboxService = SyncOutboxService;
exports.SyncOutboxService = SyncOutboxService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sync_outbox_event_entity_1.SyncOutboxEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService,
        typeorm_2.DataSource])
], SyncOutboxService);
//# sourceMappingURL=sync-outbox.service.js.map