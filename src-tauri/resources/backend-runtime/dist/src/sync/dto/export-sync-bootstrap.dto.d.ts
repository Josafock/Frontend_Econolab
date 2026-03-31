import { type SupportedInboundSyncResourceType } from '../sync-resource.util';
export declare class ExportSyncBootstrapDto {
    resourceType: SupportedInboundSyncResourceType;
    cursor?: string;
    limit?: number;
    includeDeleted?: boolean;
}
