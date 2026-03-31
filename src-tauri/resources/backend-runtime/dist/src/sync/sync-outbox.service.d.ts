import { ConfigService } from '@nestjs/config';
import { Repository, DataSource } from 'typeorm';
import { SyncOutboxEvent } from './entities/sync-outbox-event.entity';
export declare class SyncOutboxService {
    private readonly outboxRepo;
    private readonly configService;
    private readonly dataSource;
    constructor(outboxRepo: Repository<SyncOutboxEvent>, configService: ConfigService, dataSource: DataSource);
    private get runtimeConfig();
    get outboxEnabled(): boolean;
    private normalizeBatchSize;
    listPending(limit?: number): Promise<SyncOutboxEvent[]>;
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
    claimPendingBatch(limit?: number): Promise<{
        leaseToken: `${string}-${string}-${string}-${string}-${string}` | null;
        events: SyncOutboxEvent[];
    }>;
    private buildLeaseWhere;
    markAsSynced(leaseToken: string, ids?: number[]): Promise<{
        affected: number;
    }>;
    markAsFailed(leaseToken: string, id: number, errorMessage: string): Promise<void>;
    requeue(ids: number[], includeProcessing?: boolean): Promise<{
        affected: number;
    }>;
    requeueAllFailed(): Promise<{
        affected: number;
    }>;
    discardAllFailed(): Promise<{
        affected: number;
    }>;
    requeueFailedReady(): Promise<{
        affected: number;
    }>;
    failBatch(leaseToken: string, failures: Array<{
        id: number;
        error: string;
    }>): Promise<{
        affected: number;
    }>;
    private withSyncSuppressed;
    private markEntitiesAsSynced;
    private getResourceSyncSummary;
}
