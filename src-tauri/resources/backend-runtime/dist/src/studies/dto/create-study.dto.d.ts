import { StudyStatus, StudyType } from '../entities/study.entity';
export declare class CreateStudyDto {
    name: string;
    code?: string;
    autoGenerateCode?: boolean;
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
    packageStudyIds?: number[];
    status?: StudyStatus;
}
