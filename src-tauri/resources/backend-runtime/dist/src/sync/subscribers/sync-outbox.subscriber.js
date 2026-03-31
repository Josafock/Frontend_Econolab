"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncOutboxSubscriber = void 0;
const typeorm_1 = require("typeorm");
const sync_config_1 = require("../../config/sync.config");
const sync_outbox_event_entity_1 = require("../entities/sync-outbox-event.entity");
const sync_resource_util_1 = require("../sync-resource.util");
const sync_entity_util_1 = require("../sync-entity.util");
const OUTBOX_RECURSION_FLAG = '__syncOutboxWriting__';
const IGNORED_UPDATE_COLUMNS = new Set(['lastSyncedAt', 'lastSyncedVersion']);
let SyncOutboxSubscriber = class SyncOutboxSubscriber {
    async afterInsert(event) {
        await this.enqueueMutation(event, sync_outbox_event_entity_1.SyncOutboxOperation.UPSERT);
    }
    async afterUpdate(event) {
        if (this.shouldIgnoreUpdate(event)) {
            return;
        }
        const snapshot = this.getTrackedSnapshot(event.metadata, event.entity, event.databaseEntity);
        if (!snapshot) {
            return;
        }
        const previousDeletedAt = event.databaseEntity
            ?.deletedAt;
        const nextDeletedAt = snapshot.deletedAt;
        const operation = previousDeletedAt == null && nextDeletedAt != null
            ? sync_outbox_event_entity_1.SyncOutboxOperation.DELETE
            : sync_outbox_event_entity_1.SyncOutboxOperation.UPSERT;
        await this.enqueueMutation(event, operation, snapshot);
    }
    async afterRemove(event) {
        const snapshot = this.getTrackedSnapshot(event.metadata, event.entity, event.databaseEntity);
        if (snapshot?.deletedAt != null) {
            return;
        }
        await this.enqueueMutation(event, sync_outbox_event_entity_1.SyncOutboxOperation.DELETE, snapshot);
    }
    shouldTrackOutbox() {
        return (0, sync_config_1.getSyncRuntimeConfig)().outboxEnabled;
    }
    isTrackedMetadata(metadata) {
        if (metadata.tableName === 'sync_outbox_events') {
            return false;
        }
        const propertyNames = new Set(metadata.columns.map((column) => column.propertyName));
        return (propertyNames.has('publicId') &&
            propertyNames.has('syncVersion') &&
            propertyNames.has('syncOrigin'));
    }
    getTrackedSnapshot(metadata, entity, databaseEntity) {
        if (!this.isTrackedMetadata(metadata)) {
            return null;
        }
        const source = entity ?? databaseEntity;
        if (!source) {
            return null;
        }
        const publicId = this.getColumnValue(metadata, 'publicId', source, databaseEntity);
        if (!publicId) {
            return null;
        }
        return {
            id: this.getPrimaryValue(metadata, source, databaseEntity),
            publicId,
            syncVersion: Number(this.getColumnValue(metadata, 'syncVersion', source, databaseEntity)) || 1,
            syncOrigin: this.getColumnValue(metadata, 'syncOrigin', source, databaseEntity) ?? null,
            deletedAt: this.getColumnValue(metadata, 'deletedAt', source, databaseEntity),
        };
    }
    getPrimaryValue(metadata, source, fallback) {
        const primaryColumn = metadata.primaryColumns[0];
        if (!primaryColumn) {
            return undefined;
        }
        const primaryValue = primaryColumn.getEntityValue(source) ??
            (fallback ? primaryColumn.getEntityValue(fallback) : undefined);
        return primaryValue;
    }
    getColumnValue(metadata, propertyName, source, fallback) {
        const column = metadata.columns.find((candidate) => candidate.propertyName === propertyName);
        if (!column) {
            return undefined;
        }
        return (column.getEntityValue(source) ??
            (fallback ? column.getEntityValue(fallback) : undefined));
    }
    shouldIgnoreUpdate(event) {
        if (!this.isTrackedMetadata(event.metadata)) {
            return true;
        }
        if (event.updatedColumns.length === 0) {
            return false;
        }
        return event.updatedColumns.every((column) => IGNORED_UPDATE_COLUMNS.has(column.propertyName));
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
        const serializedEntries = Object.entries(value).map(([key, nestedValue]) => [
            key,
            this.serializeValue(nestedValue),
        ]);
        return Object.fromEntries(serializedEntries);
    }
    async buildPayload(metadata, resourceType, manager, entity, databaseEntity) {
        const source = entity ?? databaseEntity;
        if (!source) {
            return {};
        }
        const payload = Object.fromEntries(metadata.columns
            .filter((column) => !column.isVirtual)
            .map((column) => {
            const value = column.getEntityValue(source) ??
                (databaseEntity ? column.getEntityValue(databaseEntity) : undefined);
            return [column.propertyName, this.serializeValue(value)];
        }));
        return (0, sync_resource_util_1.buildPortableSyncPayload)(resourceType, payload, manager);
    }
    getEventDatabaseEntity(event) {
        if ('databaseEntity' in event) {
            return event.databaseEntity;
        }
        return undefined;
    }
    async enqueueMutation(event, operation, providedSnapshot) {
        if (!this.shouldTrackOutbox()) {
            return;
        }
        const { queryRunner, metadata } = event;
        const queryRunnerData = typeof queryRunner.data === 'object' && queryRunner.data !== null
            ? queryRunner.data
            : {};
        if (queryRunnerData[OUTBOX_RECURSION_FLAG] ||
            queryRunnerData[sync_entity_util_1.SYNC_OUTBOX_SKIP_FLAG]) {
            return;
        }
        const snapshot = providedSnapshot ??
            this.getTrackedSnapshot(metadata, event.entity, this.getEventDatabaseEntity(event));
        if (!snapshot) {
            return;
        }
        const payload = await this.buildPayload(metadata, metadata.tableName, queryRunner.manager, event.entity, this.getEventDatabaseEntity(event));
        const outboxRepo = queryRunner.manager.getRepository(sync_outbox_event_entity_1.SyncOutboxEvent);
        queryRunnerData[OUTBOX_RECURSION_FLAG] = true;
        queryRunner.data = queryRunnerData;
        try {
            await outboxRepo.save(outboxRepo.create({
                resourceType: metadata.tableName,
                resourcePublicId: snapshot.publicId,
                resourceLocalId: snapshot.id == null ? null : String(this.serializeValue(snapshot.id)),
                operation,
                status: sync_outbox_event_entity_1.SyncOutboxStatus.PENDING,
                syncVersion: snapshot.syncVersion,
                syncOrigin: snapshot.syncOrigin,
                payload,
                attempts: 0,
                lastError: null,
                availableAt: new Date(),
                processedAt: null,
            }));
        }
        finally {
            delete queryRunnerData[OUTBOX_RECURSION_FLAG];
            queryRunner.data = queryRunnerData;
        }
    }
};
exports.SyncOutboxSubscriber = SyncOutboxSubscriber;
exports.SyncOutboxSubscriber = SyncOutboxSubscriber = __decorate([
    (0, typeorm_1.EventSubscriber)()
], SyncOutboxSubscriber);
//# sourceMappingURL=sync-outbox.subscriber.js.map