export declare const SYNC_OUTBOX_SKIP_FLAG = "__skipSyncOutbox__";
export declare function markSyncEntityForRemoteApply<T extends object>(entity: T): T;
export declare function shouldPreserveRemoteSyncMetadata(entity: unknown): boolean;
