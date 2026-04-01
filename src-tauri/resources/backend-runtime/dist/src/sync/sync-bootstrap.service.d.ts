import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { type SupportedInboundSyncResourceType } from './sync-resource.util';
import type { SyncInboundMutationInput } from './dto/apply-sync-mutations.dto';
export declare class SyncBootstrapService {
    private readonly dataSource;
    private readonly configService;
    constructor(dataSource: DataSource, configService: ConfigService);
    private get runtimeConfig();
    private normalizeLimit;
    private serializeValue;
    private buildPayload;
    private ensurePublicIdsForResource;
    exportResourcePage(resourceType: SupportedInboundSyncResourceType, options?: {
        cursor?: string;
        limit?: number;
        includeDeleted?: boolean;
    }): Promise<{
        resourceType: "users" | "doctors" | "patients" | "service_orders" | "service_order_items" | "studies" | "study_details" | "study_results" | "study_result_values";
        count: number;
        hasMore: boolean;
        nextCursor: string | null;
        mutations: SyncInboundMutationInput[];
    }>;
    getSupportedResources(): ("users" | "doctors" | "patients" | "service_orders" | "service_order_items" | "studies" | "study_details" | "study_results" | "study_result_values")[];
}
