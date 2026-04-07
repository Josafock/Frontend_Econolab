import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { SyncRemoteClientService } from './sync-remote-client.service';
import { SyncBootstrapService } from './sync-bootstrap.service';
import { SyncInboundService } from './sync-inbound.service';
import { SyncOutboxService } from './sync-outbox.service';
import { type SupportedInboundSyncResourceType } from './sync-resource.util';
export declare class SyncRunnerService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly dataSource;
    private readonly syncOutbox;
    private readonly syncInbound;
    private readonly syncBootstrap;
    private readonly syncRemoteClient;
    private readonly logger;
    private autoInterval;
    private startupTimer;
    private startupSyncPromise;
    private readonly attemptedEmptyBootstrapResources;
    private running;
    private lastRunAt;
    private lastRunResult;
    constructor(configService: ConfigService, dataSource: DataSource, syncOutbox: SyncOutboxService, syncInbound: SyncInboundService, syncBootstrap: SyncBootstrapService, syncRemoteClient: SyncRemoteClientService);
    private get runtimeConfig();
    private get autoSyncEnabled();
    private get startupSyncEnabled();
    private startStartupSync;
    onModuleInit(): void;
    onModuleDestroy(): void;
    getStatus(): {
        running: boolean;
        autoEnabled: boolean;
        startupEnabled: boolean;
        remoteBaseUrlConfigured: boolean;
        autoIntervalSeconds: number;
        lastRunAt: string | null;
        lastRunResult: Record<string, unknown> | null;
    };
    private getLocalResourceCounts;
    private resolveBootstrapResourceTypes;
    private runStartupSync;
    private getSyncFailureMessage;
    bootstrapFromRemote(options?: {
        resourceTypes?: string[];
        limit?: number;
        includeDeleted?: boolean;
    }): Promise<{
        remoteBaseUrl: string;
        resources: {
            resourceType: SupportedInboundSyncResourceType;
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
    ensureDesktopDataReady(): Promise<{
        status: "skipped_not_configured";
        resourceTypes: SupportedInboundSyncResourceType[];
        sync: null;
        bootstrap?: undefined;
    } | {
        status: "completed" | "up_to_date";
        resourceTypes: ("users" | "doctors" | "patients" | "service_orders" | "service_order_items" | "studies" | "study_details" | "study_results" | "study_result_values")[];
        bootstrap: {
            remoteBaseUrl: string;
            resources: {
                resourceType: SupportedInboundSyncResourceType;
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
        } | null;
        sync: {
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
        };
    }>;
    runOnce(options?: {
        pushLimit?: number;
        pullLimit?: number;
        reason?: string;
    }): Promise<{
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
    private pushPendingBatch;
    private pullPendingBatch;
}
