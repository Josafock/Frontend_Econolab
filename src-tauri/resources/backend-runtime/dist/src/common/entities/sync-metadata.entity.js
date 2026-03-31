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
exports.SyncMetadataEntity = void 0;
const node_crypto_1 = require("node:crypto");
const typeorm_1 = require("typeorm");
const portable_column_options_1 = require("../../database/portable-column-options");
const sync_config_1 = require("../../config/sync.config");
const sync_entity_util_1 = require("../../sync/sync-entity.util");
class SyncMetadataEntity {
    getDefaultSyncOrigin() {
        return (0, sync_config_1.getSyncRuntimeConfig)().defaultOrigin;
    }
    publicId;
    syncVersion;
    lastSyncedVersion;
    syncOrigin;
    lastSyncedAt;
    deletedAt;
    ensureSyncMetadataOnInsert() {
        const preserveRemoteMetadata = (0, sync_entity_util_1.shouldPreserveRemoteSyncMetadata)(this);
        if (!this.publicId) {
            this.publicId = (0, node_crypto_1.randomUUID)();
        }
        if (!this.syncVersion || this.syncVersion < 1) {
            this.syncVersion = 1;
        }
        if (this.lastSyncedVersion == null || this.lastSyncedVersion < 0) {
            this.lastSyncedVersion = 0;
        }
        if (!this.syncOrigin) {
            this.syncOrigin = this.getDefaultSyncOrigin();
        }
        if (preserveRemoteMetadata) {
            return;
        }
    }
    ensureSyncMetadataOnUpdate() {
        const preserveRemoteMetadata = (0, sync_entity_util_1.shouldPreserveRemoteSyncMetadata)(this);
        if (!this.publicId) {
            this.publicId = (0, node_crypto_1.randomUUID)();
        }
        if (!this.syncOrigin) {
            this.syncOrigin = this.getDefaultSyncOrigin();
        }
        this.lastSyncedVersion = Math.max(0, this.lastSyncedVersion ?? 0);
        if (preserveRemoteMetadata) {
            this.syncVersion = Math.max(1, this.syncVersion ?? 1);
            return;
        }
        this.syncVersion = Math.max(1, this.syncVersion ?? 1) + 1;
    }
}
exports.SyncMetadataEntity = SyncMetadataEntity;
__decorate([
    (0, typeorm_1.Column)({
        name: 'public_id',
        type: 'varchar',
        length: 36,
        unique: true,
        nullable: true,
    }),
    __metadata("design:type", Object)
], SyncMetadataEntity.prototype, "publicId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sync_version', type: 'int', default: 1 }),
    __metadata("design:type", Number)
], SyncMetadataEntity.prototype, "syncVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_synced_version', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SyncMetadataEntity.prototype, "lastSyncedVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sync_origin', type: 'varchar', length: 32, default: 'server' }),
    __metadata("design:type", String)
], SyncMetadataEntity.prototype, "syncOrigin", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableTimestampColumnOptions)({ name: 'last_synced_at', nullable: true }, 'timestamp')),
    __metadata("design:type", Object)
], SyncMetadataEntity.prototype, "lastSyncedAt", void 0);
__decorate([
    (0, typeorm_1.Column)((0, portable_column_options_1.getPortableTimestampColumnOptions)({ name: 'deleted_at', nullable: true }, 'timestamp')),
    __metadata("design:type", Object)
], SyncMetadataEntity.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SyncMetadataEntity.prototype, "ensureSyncMetadataOnInsert", null);
__decorate([
    (0, typeorm_1.BeforeUpdate)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SyncMetadataEntity.prototype, "ensureSyncMetadataOnUpdate", null);
//# sourceMappingURL=sync-metadata.entity.js.map