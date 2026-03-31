import { DataSource } from 'typeorm';
import { SyncOutboxOperation } from './entities/sync-outbox-event.entity';
import type { SyncInboundMutationInput } from './dto/apply-sync-mutations.dto';
type ApplyMutationStatus = 'applied' | 'skipped_stale' | 'skipped_duplicate' | 'deferred_missing_dependency' | 'failed' | 'unsupported_resource';
type ApplyMutationResult = {
    index: number;
    resourceType: string;
    operation: SyncOutboxOperation;
    publicId: string | null;
    status: ApplyMutationStatus;
    localId: number | null;
    message: string;
};
export declare class SyncInboundService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    applyBatch(mutations: SyncInboundMutationInput[]): Promise<{
        total: number;
        appliedCount: number;
        skippedCount: number;
        deferredCount: number;
        failedCount: number;
        results: ApplyMutationResult[];
    }>;
    private applySingleMutation;
    private withInboundContext;
    private applySupportedMutation;
    private shouldSkipMutation;
    private confirmEntitySyncState;
    private isDuplicateMutation;
    private applyUser;
    private applyPatient;
    private applyDoctor;
    private applyStudy;
    private applyStudyDetail;
    private applyServiceOrder;
    private applyServiceOrderItem;
    private applyStudyResult;
    private applyStudyResultValue;
}
export {};
