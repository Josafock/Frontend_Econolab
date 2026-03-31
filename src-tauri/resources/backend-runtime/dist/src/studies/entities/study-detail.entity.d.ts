import { Study } from './study.entity';
import { SyncMetadataEntity } from '../../common/entities/sync-metadata.entity';
export declare enum StudyDetailType {
    CATEGORY = "category",
    PARAMETER = "parameter"
}
export declare class StudyDetail extends SyncMetadataEntity {
    id: number;
    study: Study;
    studyId: number;
    parent?: StudyDetail | null;
    parentId?: number | null;
    dataType: StudyDetailType;
    name: string;
    sortOrder: number;
    unit?: string;
    referenceValue?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
