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
exports.SyncBootstrapService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const config_1 = require("@nestjs/config");
const sync_outbox_event_entity_1 = require("./entities/sync-outbox-event.entity");
const sync_resource_util_1 = require("./sync-resource.util");
function toBoolean(value, defaultValue) {
    return value ?? defaultValue;
}
let SyncBootstrapService = class SyncBootstrapService {
    dataSource;
    configService;
    constructor(dataSource, configService) {
        this.dataSource = dataSource;
        this.configService = configService;
    }
    get runtimeConfig() {
        return this.configService.getOrThrow('sync');
    }
    normalizeLimit(limit) {
        const requested = Number(limit ?? this.runtimeConfig.bootstrapBatchSize);
        if (!Number.isFinite(requested) || requested < 1) {
            return 1;
        }
        return Math.min(Math.trunc(requested), 1000);
    }
    serializeValue(value) {
        if (value instanceof Date) {
            return value.toISOString();
        }
        if (Array.isArray(value)) {
            return value.map((item) => this.serializeValue(item));
        }
        if (!value || typeof value !== 'object') {
            return value;
        }
        return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [
            key,
            this.serializeValue(nestedValue),
        ]));
    }
    async buildPayload(metadata, resourceType, manager, entity) {
        const payload = Object.fromEntries(metadata.columns
            .filter((column) => !column.isVirtual)
            .map((column) => [
            column.propertyName,
            this.serializeValue(column.getEntityValue(entity)),
        ]));
        return (0, sync_resource_util_1.buildPortableSyncPayload)(resourceType, payload, manager);
    }
    async ensurePublicIdsForResource(manager, metadata, alias) {
        const publicIdColumn = metadata.columns.find((column) => column.propertyName === 'publicId');
        const primaryColumn = metadata.primaryColumns[0];
        const primaryProperty = primaryColumn?.propertyPath;
        if (!publicIdColumn || !primaryColumn || !primaryProperty) {
            return;
        }
        const rowsMissingPublicId = await manager
            .getRepository(metadata.target)
            .createQueryBuilder(alias)
            .select(`${alias}.${primaryProperty}`, 'id')
            .where(`${alias}.${publicIdColumn.propertyPath} IS NULL`)
            .getRawMany();
        for (const row of rowsMissingPublicId) {
            await manager
                .createQueryBuilder()
                .update(metadata.target)
                .set({
                [publicIdColumn.propertyName]: (0, node_crypto_1.randomUUID)(),
            })
                .where(`${primaryProperty} = :id`, { id: row.id })
                .execute();
        }
    }
    async exportResourcePage(resourceType, options) {
        const entity = (0, sync_resource_util_1.getSyncTrackedResourceEntity)(resourceType);
        if (!entity) {
            throw new Error(`Recurso ${resourceType} no soportado para bootstrap.`);
        }
        return this.dataSource.transaction(async (manager) => {
            const repo = manager.getRepository(entity);
            const metadata = repo.metadata;
            const primaryColumn = metadata.primaryColumns[0];
            const primaryProperty = primaryColumn?.propertyPath;
            const alias = metadata.tableName;
            if (!primaryColumn || !primaryProperty) {
                throw new Error(`El recurso ${resourceType} no tiene una clave primaria util para bootstrap.`);
            }
            await this.ensurePublicIdsForResource(manager, metadata, alias);
            const includeDeleted = toBoolean(options?.includeDeleted, true);
            const limit = this.normalizeLimit(options?.limit);
            const qb = repo.createQueryBuilder(alias);
            qb.orderBy(`${alias}.${primaryProperty}`, 'ASC');
            if (options?.cursor) {
                qb.andWhere(`${alias}.${primaryProperty} > :cursor`, {
                    cursor: options.cursor,
                });
            }
            if (!includeDeleted && metadata.columns.some((column) => column.propertyName === 'deletedAt')) {
                qb.andWhere(`${alias}.deletedAt IS NULL`);
            }
            qb.take(limit);
            const rows = await qb.getMany();
            const mutations = [];
            for (const row of rows) {
                const payload = await this.buildPayload(metadata, resourceType, manager, row);
                const operation = row.deletedAt != null
                    ? sync_outbox_event_entity_1.SyncOutboxOperation.DELETE
                    : sync_outbox_event_entity_1.SyncOutboxOperation.UPSERT;
                mutations.push({
                    resourceType,
                    operation,
                    payload,
                });
            }
            const lastRow = rows.at(-1);
            const nextCursor = lastRow
                ? String(primaryColumn.getEntityValue(lastRow))
                : null;
            return {
                resourceType,
                count: mutations.length,
                hasMore: rows.length === limit,
                nextCursor,
                mutations,
            };
        });
    }
    getSupportedResources() {
        return [...sync_resource_util_1.SUPPORTED_INBOUND_SYNC_RESOURCES];
    }
};
exports.SyncBootstrapService = SyncBootstrapService;
exports.SyncBootstrapService = SyncBootstrapService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        config_1.ConfigService])
], SyncBootstrapService);
//# sourceMappingURL=sync-bootstrap.service.js.map