import { type EntityManager, type ObjectLiteral } from 'typeorm';
export declare const SUPPORTED_INBOUND_SYNC_RESOURCES: readonly ["users", "patients", "doctors", "studies", "study_details", "service_orders", "service_order_items", "study_results", "study_result_values"];
export type SupportedInboundSyncResourceType = (typeof SUPPORTED_INBOUND_SYNC_RESOURCES)[number];
export declare const SYNC_TRACKED_RESOURCE_ENTITY_MAP: Record<SupportedInboundSyncResourceType, new () => ObjectLiteral>;
export declare function buildPortableSyncPayload(resourceType: string, payload: Record<string, unknown>, manager: EntityManager): Promise<Record<string, unknown>>;
export declare function isSupportedInboundSyncResourceType(value: string): value is SupportedInboundSyncResourceType;
export declare function getSyncTrackedResourceEntity(resourceType: string): (new () => ObjectLiteral) | null;
export declare function sortSyncMutationsByResource<T extends {
    resourceType: string;
}>(items: T[]): T[];
export declare class MissingSyncDependencyError extends Error {
    readonly resourceType: string;
    readonly dependencyName: string;
    readonly dependencyPublicId: string;
    constructor(resourceType: string, dependencyName: string, dependencyPublicId: string);
}
export declare function requireLocalIdByPublicId<TEntity extends {
    id: number;
}>(manager: EntityManager, entity: new () => TEntity, publicId: string | null | undefined, dependencyName: string, resourceType: string): Promise<number | null>;
