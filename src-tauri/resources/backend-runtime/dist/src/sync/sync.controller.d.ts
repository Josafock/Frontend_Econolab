import { ApplySyncMutationsDto } from './dto/apply-sync-mutations.dto';
import { ClaimSyncOutboxDto } from './dto/claim-sync-outbox.dto';
import { FailSyncOutboxDto } from './dto/fail-sync-outbox.dto';
import { LeaseSyncOutboxDto } from './dto/lease-sync-outbox.dto';
import { RequeueSyncOutboxDto } from './dto/requeue-sync-outbox.dto';
import { SyncInboundService } from './sync-inbound.service';
import { SyncOutboxService } from './sync-outbox.service';
export declare class SyncController {
    private readonly syncOutbox;
    private readonly syncInbound;
    constructor(syncOutbox: SyncOutboxService, syncInbound: SyncInboundService);
    getSummary(): Promise<{
        outboxEnabled: boolean;
        counts: {
            pending: number;
            processing: number;
            failed: number;
            synced: number;
        };
        nextAvailableAt: Date | null;
        resources: {
            [k: string]: {
                readonly total: number;
                readonly pendingSync: number;
            };
        };
    }>;
    claim(dto: ClaimSyncOutboxDto): Promise<{
        leaseToken: `${string}-${string}-${string}-${string}-${string}` | null;
        count: number;
        events: import("./entities/sync-outbox-event.entity").SyncOutboxEvent[];
    }>;
    ack(dto: LeaseSyncOutboxDto): Promise<{
        message: string;
        affected: number;
    }>;
    fail(dto: FailSyncOutboxDto): Promise<{
        message: string;
        affected: number;
    }>;
    requeue(dto: RequeueSyncOutboxDto): Promise<{
        message: string;
        affected: number;
    }>;
    requeueFailedAll(): Promise<{
        message: string;
        affected: number;
    }>;
    discardFailedAll(): Promise<{
        message: string;
        affected: number;
    }>;
    applyInbound(dto: ApplySyncMutationsDto): Promise<{
        total: number;
        appliedCount: number;
        skippedCount: number;
        deferredCount: number;
        failedCount: number;
        results: {
            index: number;
            resourceType: string;
            operation: import("./entities/sync-outbox-event.entity").SyncOutboxOperation;
            publicId: string | null;
            status: "failed" | "applied" | "skipped_stale" | "skipped_duplicate" | "deferred_missing_dependency" | "unsupported_resource";
            localId: number | null;
            message: string;
        }[];
    }>;
}
