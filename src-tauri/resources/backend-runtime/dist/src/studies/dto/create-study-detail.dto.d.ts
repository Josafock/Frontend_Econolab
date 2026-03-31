import { StudyDetailType } from '../entities/study-detail.entity';
export declare class CreateStudyDetailDto {
    dataType: StudyDetailType;
    name: string;
    sortOrder: number;
    unit?: string;
    referenceValue?: string;
    parentId?: number | null;
}
