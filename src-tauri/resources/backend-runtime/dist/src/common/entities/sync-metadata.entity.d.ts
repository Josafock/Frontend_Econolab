export declare abstract class SyncMetadataEntity {
    private getDefaultSyncOrigin;
    publicId: string | null;
    syncVersion: number;
    lastSyncedVersion: number;
    syncOrigin: string;
    lastSyncedAt: Date | null;
    deletedAt: Date | null;
    ensureSyncMetadataOnInsert(): void;
    ensureSyncMetadataOnUpdate(): void;
}
