import { ConfigService } from '@nestjs/config';
import type { SyncOutboxEvent } from './entities/sync-outbox-event.entity';
import type { SyncInboundMutationInput } from './dto/apply-sync-mutations.dto';
import type { SupportedInboundSyncResourceType } from './sync-resource.util';
type ClaimRemoteBatchResponse = {
    leaseToken: string | null;
    count: number;
    events: SyncOutboxEvent[];
};
type LeaseMutationResult = {
    message: string;
    affected: number;
};
type ExportBootstrapPageResponse = {
    resourceType: SupportedInboundSyncResourceType;
    count: number;
    hasMore: boolean;
    nextCursor: string | null;
    mutations: SyncInboundMutationInput[];
};
export declare class SyncRemoteClientService {
    private readonly configService;
    constructor(configService: ConfigService);
    private get runtimeConfig();
    private getRemoteBaseUrl;
    private getRemoteHeaders;
    private request;
    claimPendingBatch(limit?: number): Promise<ClaimRemoteBatchResponse>;
    ackBatch(leaseToken: string, ids: number[]): Promise<LeaseMutationResult>;
    failBatch(leaseToken: string, failures: Array<{
        id: number;
        error: string;
    }>): Promise<LeaseMutationResult>;
    applyInbound(mutations: SyncInboundMutationInput[]): Promise<{
        total: number;
        appliedCount: number;
        skippedCount: number;
        deferredCount: number;
        failedCount: number;
        results: Array<{
            index: number;
            status: string;
            message: string;
        }>;
    }>;
    exportBootstrapPage(options: {
        resourceType: SupportedInboundSyncResourceType;
        cursor?: string;
        limit?: number;
        includeDeleted?: boolean;
    }): Promise<ExportBootstrapPageResponse>;
}
export {};
