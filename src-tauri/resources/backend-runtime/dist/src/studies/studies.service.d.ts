import { Repository } from 'typeorm';
import { Study, StudyStatus, StudyType } from './entities/study.entity';
import { StudyDetail } from './entities/study-detail.entity';
import { CreateStudyDto } from './dto/create-study.dto';
import { UpdateStudyDto } from './dto/update-study.dto';
import { CreateStudyDetailDto } from './dto/create-study-detail.dto';
import { UpdateStudyDetailDto } from './dto/update-study-detail.dto';
import { UpdateStudyDetailStatusDto } from './dto/update-study-detail-status.dto';
import { DatabaseDialectService } from '../database/database-dialect.service';
import { RuntimePolicyService } from '../runtime/runtime-policy.service';
export declare class StudiesService {
    private readonly studyRepo;
    private readonly detailRepo;
    private readonly databaseDialect;
    private readonly runtimePolicy;
    constructor(studyRepo: Repository<Study>, detailRepo: Repository<StudyDetail>, databaseDialect: DatabaseDialectService, runtimePolicy: RuntimePolicyService);
    private normalizeSearchValue;
    private buildNormalizedSql;
    private getLabDateToken;
    private buildAutoStudyCode;
    private extractAutoSequenceValue;
    private isUniqueConstraintError;
    private getNextAutoStudyCode;
    private normalizeStudyCode;
    private findDuplicateStudyByName;
    private assertNoDuplicateStudyName;
    private findActiveStudyOrFail;
    private findDetailOrFail;
    private ensureStudyAllowsDirectDetails;
    private assertParentDetailExists;
    getSuggestedCode(type?: StudyType): Promise<{
        code: string;
    }>;
    private validatePackageStudyIds;
    search(search: string, type?: StudyType, status?: StudyStatus, page?: number, limit?: number): Promise<{
        data: Study[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    existsByCode(code: string): Promise<{
        exists: boolean;
        studyId: number | null;
    }>;
    create(dto: CreateStudyDto): Promise<Study>;
    findOne(id: number): Promise<Study>;
    update(id: number, dto: UpdateStudyDto): Promise<Study>;
    softDelete(id: number): Promise<{
        message: string;
    }>;
    hardDelete(id: number): Promise<{
        message: string;
    }>;
    listDetails(studyId: number): Promise<StudyDetail[]>;
    createDetail(studyId: number, dto: CreateStudyDetailDto): Promise<StudyDetail>;
    updateDetail(detailId: number, dto: UpdateStudyDetailDto): Promise<StudyDetail>;
    updateDetailStatus(detailId: number, dto: UpdateStudyDetailStatusDto): Promise<StudyDetail>;
    softDeleteDetail(detailId: number): Promise<{
        message: string;
    }>;
    hardDeleteDetail(detailId: number): Promise<{
        message: string;
    }>;
}
