import { SyncMetadataEntity } from '../../common/entities/sync-metadata.entity';
export declare enum StudyType {
    STUDY = "study",
    PACKAGE = "package",
    OTHER = "other"
}
export declare enum StudyStatus {
    ACTIVE = "active",
    SUSPENDED = "suspended"
}
export declare class Study extends SyncMetadataEntity {
    id: number;
    name: string;
    code: string;
    description?: string;
    durationMinutes: number;
    type: StudyType;
    normalPrice: number;
    difPrice: number;
    specialPrice: number;
    hospitalPrice: number;
    otherPrice: number;
    defaultDiscountPercent: number;
    method?: string;
    indicator?: string;
    packageStudyIds: number[];
    status: StudyStatus;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
