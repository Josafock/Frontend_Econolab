"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYNC_OUTBOX_SKIP_FLAG = void 0;
exports.markSyncEntityForRemoteApply = markSyncEntityForRemoteApply;
exports.shouldPreserveRemoteSyncMetadata = shouldPreserveRemoteSyncMetadata;
exports.SYNC_OUTBOX_SKIP_FLAG = '__skipSyncOutbox__';
const SYNC_METADATA_PRESERVE_REMOTE_FLAG = '__preserveRemoteSyncMetadata__';
function markSyncEntityForRemoteApply(entity) {
    Object.defineProperty(entity, SYNC_METADATA_PRESERVE_REMOTE_FLAG, {
        value: true,
        configurable: true,
        enumerable: false,
        writable: true,
    });
    return entity;
}
function shouldPreserveRemoteSyncMetadata(entity) {
    if (!entity || typeof entity !== 'object') {
        return false;
    }
    return Boolean(entity[SYNC_METADATA_PRESERVE_REMOTE_FLAG]);
}
//# sourceMappingURL=sync-entity.util.js.map