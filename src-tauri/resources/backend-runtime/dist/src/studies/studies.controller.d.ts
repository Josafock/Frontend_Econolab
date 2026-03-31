import { StudiesService } from './studies.service';
import { CreateStudyDto } from './dto/create-study.dto';
import { UpdateStudyDto } from './dto/update-study.dto';
import { CreateStudyDetailDto } from './dto/create-study-detail.dto';
import { UpdateStudyDetailDto } from './dto/update-study-detail.dto';
import { UpdateStudyDetailStatusDto } from './dto/update-study-detail-status.dto';
import { StudyStatus, StudyType } from './entities/study.entity';
export declare class StudiesController {
    private readonly studiesService;
    constructor(studiesService: StudiesService);
    search(search?: string, type?: StudyType, status?: StudyStatus, page?: number, limit?: number): Promise<{
        data: import("./entities/study.entity").Study[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    exists(code: string): Promise<{
        exists: boolean;
        studyId: number | null;
    }>;
    getSuggestedCode(type?: StudyType): Promise<{
        code: string;
    }>;
    create(dto: CreateStudyDto): Promise<{
        message: string;
        data: import("./entities/study.entity").Study;
    }>;
    findOne(id: string): Promise<import("./entities/study.entity").Study>;
    update(id: string, dto: UpdateStudyDto): Promise<{
        message: string;
        data: import("./entities/study.entity").Study;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    hardRemove(id: string): Promise<{
        message: string;
    }>;
    listDetails(id: string): Promise<import("./entities/study-detail.entity").StudyDetail[]>;
    createDetail(id: string, dto: CreateStudyDetailDto): Promise<{
        message: string;
        data: import("./entities/study-detail.entity").StudyDetail;
    }>;
    updateDetail(detailId: string, dto: UpdateStudyDetailDto): Promise<{
        message: string;
        data: import("./entities/study-detail.entity").StudyDetail;
    }>;
    updateDetailStatus(detailId: string, dto: UpdateStudyDetailStatusDto): Promise<{
        message: string;
        data: import("./entities/study-detail.entity").StudyDetail;
    }>;
    removeDetail(detailId: string): Promise<{
        message: string;
    }>;
    hardRemoveDetail(detailId: string): Promise<{
        message: string;
    }>;
}
