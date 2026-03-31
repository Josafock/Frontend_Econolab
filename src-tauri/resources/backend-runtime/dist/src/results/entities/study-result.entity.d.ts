import { ServiceOrder, ServiceOrderItem } from '../../services/entities/service-order.entity';
import { StudyDetail } from '../../studies/entities/study-detail.entity';
import { SyncMetadataEntity } from '../../common/entities/sync-metadata.entity';
export declare class StudyResult extends SyncMetadataEntity {
    id: number;
    serviceOrder: ServiceOrder;
    serviceOrderId: number;
    serviceOrderItem: ServiceOrderItem;
    serviceOrderItemId: number;
    sampleAt?: Date;
    reportedAt?: Date;
    method?: string;
    observations?: string;
    isDraft: boolean;
    isActive: boolean;
    values: StudyResultValue[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class StudyResultValue extends SyncMetadataEntity {
    id: number;
    result: StudyResult;
    studyResultId: number;
    studyDetail?: StudyDetail;
    studyDetailId?: number;
    label: string;
    unit?: string;
    referenceValue?: string;
    value?: string;
    sortOrder: number;
    visible: boolean;
    createdAt: Date;
    updatedAt: Date;
}
