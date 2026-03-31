import { ExportSyncBootstrapDto } from './dto/export-sync-bootstrap.dto';
import { PullSyncBootstrapDto } from './dto/pull-sync-bootstrap.dto';
import { RunSyncCycleDto } from './dto/run-sync-cycle.dto';
import { SyncBootstrapService } from './sync-bootstrap.service';
import { SyncRunnerService } from './sync-runner.service';
export declare class SyncManagementController {
    private readonly syncBootstrap;
    private readonly syncRunner;
    constructor(syncBootstrap: SyncBootstrapService, syncRunner: SyncRunnerService);
    getStatus(): {
        running: boolean;
        autoEnabled: boolean;
        startupEnabled: boolean;
        remoteBaseUrlConfigured: boolean;
        autoIntervalSeconds: number;
        lastRunAt: string | null;
        lastRunResult: Record<string, unknown> | null;
    };
    runOnce(dto: RunSyncCycleDto): Promise<{
        status: string;
        message: string;
    } | {
        status: string;
        reason: string;
        remoteBaseUrl: string;
        push: {
            claimed: number;
            synced: number;
            failed: number;
            error?: string;
        };
        pull: {
            claimed: number;
            synced: number;
            failed: number;
            error?: string;
        };
    }>;
    exportBootstrap(dto: ExportSyncBootstrapDto): Promise<{
        resourceType: "users" | "doctors" | "patients" | "service_orders" | "service_order_items" | "studies" | "study_details" | "study_results" | "study_result_values";
        count: number;
        hasMore: boolean;
        nextCursor: string | null;
        mutations: import("./dto/apply-sync-mutations.dto").SyncInboundMutationInput[];
    }>;
    pullBootstrap(dto: PullSyncBootstrapDto): Promise<{
        remoteBaseUrl: string;
        resources: {
            resourceType: import("./sync-resource.util").SupportedInboundSyncResourceType;
            exported: number;
            applied: number;
            skipped: number;
            deferred: number;
            failed: number;
            pages: number;
        }[];
        totals: {
            exported: number;
            applied: number;
            skipped: number;
            deferred: number;
            failed: number;
        };
    }>;
}
