export declare enum SyncOutboxOperation {
    UPSERT = "upsert",
    DELETE = "delete"
}
export declare enum SyncOutboxStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    SYNCED = "synced",
    FAILED = "failed"
}
export declare class SyncOutboxEvent {
    id: number;
    resourceType: string;
    resourcePublicId: string;
    resourceLocalId: string | null;
    operation: SyncOutboxOperation;
    status: SyncOutboxStatus;
    syncVersion: number;
    syncOrigin: string | null;
    payload: Record<string, unknown>;
    attempts: number;
    lastError: string | null;
    availableAt: Date;
    processedAt: Date | null;
    leaseToken: string | null;
    leasedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
