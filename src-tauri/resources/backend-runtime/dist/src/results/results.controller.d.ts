import { ResultsService } from './results.service';
import { CreateStudyResultDto } from './dto/create-study-result.dto';
import { UpdateStudyResultDto } from './dto/update-study-result.dto';
import { Response } from 'express';
import { DocumentArtifactService } from '../storage/document-artifact.service';
export declare class ResultsController {
    private readonly resultsService;
    private readonly documentArtifacts;
    constructor(resultsService: ResultsService, documentArtifacts: DocumentArtifactService);
    findOne(id: string): Promise<import("./entities/study-result.entity").StudyResult>;
    downloadPdf(id: string, query: Record<string, string | string[] | undefined>, res: Response): Promise<void>;
    downloadServicePdf(serviceOrderId: string, query: Record<string, string | string[] | undefined>, res: Response): Promise<void>;
    getOrCreateByServiceItem(serviceOrderItemId: string): Promise<import("./entities/study-result.entity").StudyResult>;
    create(dto: CreateStudyResultDto): Promise<{
        message: string;
        data: import("./entities/study-result.entity").StudyResult;
    }>;
    update(id: string, dto: UpdateStudyResultDto): Promise<{
        message: string;
        data: import("./entities/study-result.entity").StudyResult;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    hardRemove(id: string): Promise<{
        message: string;
    }>;
}
