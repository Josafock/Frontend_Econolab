import { Repository } from 'typeorm';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientStatusDto } from './dto/update-patient-status.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Patient } from './entities/patient.entity';
import { DatabaseDialectService } from '../database/database-dialect.service';
export declare class PatientsService {
    private readonly repo;
    private readonly databaseDialect;
    constructor(repo: Repository<Patient>, databaseDialect: DatabaseDialectService);
    private normalizeStatusFilter;
    private normalizeSearchValue;
    private get isSqlite();
    private buildNormalizedSql;
    private buildFullNameSql;
    private findByIdOrFail;
    private findPatientDuplicateByDocument;
    private findPatientDuplicateByIdentity;
    private assertNoDuplicatePatient;
    search(search: string, page?: number, limit?: number, status?: string): Promise<{
        data: Patient[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    create(dto: CreatePatientDto): Promise<Patient>;
    findOne(id: number): Promise<Patient>;
    update(id: number, dto: UpdatePatientDto): Promise<Patient>;
    softDelete(id: number): Promise<{
        message: string;
    }>;
    updateStatus(id: number, dto: UpdatePatientStatusDto): Promise<Patient>;
    existsByDocument(documentType: string, documentNumber: string): Promise<{
        exists: boolean;
        patientId: number | null;
    }>;
}
