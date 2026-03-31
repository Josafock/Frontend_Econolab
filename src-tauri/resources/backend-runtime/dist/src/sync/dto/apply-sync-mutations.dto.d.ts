import { SyncOutboxOperation } from '../entities/sync-outbox-event.entity';
declare class SyncInboundMutationDto {
    resourceType: string;
    operation: SyncOutboxOperation;
    payload: Record<string, unknown>;
}
export declare class ApplySyncMutationsDto {
    mutations: SyncInboundMutationDto[];
}
export type SyncInboundMutationInput = {
    resourceType: string;
    operation: SyncOutboxOperation;
    payload: Record<string, unknown>;
};
export {};
