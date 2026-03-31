import { type EntitySubscriberInterface, type InsertEvent, type ObjectLiteral, type RemoveEvent, type UpdateEvent } from 'typeorm';
export declare class SyncOutboxSubscriber implements EntitySubscriberInterface {
    afterInsert(event: InsertEvent<ObjectLiteral>): Promise<void>;
    afterUpdate(event: UpdateEvent<ObjectLiteral>): Promise<void>;
    afterRemove(event: RemoveEvent<ObjectLiteral>): Promise<void>;
    private shouldTrackOutbox;
    private isTrackedMetadata;
    private getTrackedSnapshot;
    private getPrimaryValue;
    private getColumnValue;
    private shouldIgnoreUpdate;
    private serializeValue;
    private buildPayload;
    private getEventDatabaseEntity;
    private enqueueMutation;
}
