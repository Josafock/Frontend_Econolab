import { StudyResultValueDto } from './study-result-value.dto';
export declare class CreateStudyResultDto {
    serviceOrderId: number;
    serviceOrderItemId: number;
    sampleAt?: string;
    reportedAt?: string;
    method?: string;
    observations?: string;
    isDraft?: boolean;
    values: StudyResultValueDto[];
}
