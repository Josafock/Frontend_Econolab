declare class SyncOutboxFailureDto {
    id: number;
    error: string;
}
export declare class FailSyncOutboxDto {
    leaseToken: string;
    failures: SyncOutboxFailureDto[];
}
export {};
