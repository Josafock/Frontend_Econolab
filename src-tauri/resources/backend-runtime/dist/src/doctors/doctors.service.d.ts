import { Repository } from 'typeorm';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorStatusDto } from './dto/update-doctor-status.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { Doctor } from './entities/doctor.entity';
import { DatabaseDialectService } from '../database/database-dialect.service';
import { RuntimePolicyService } from '../runtime/runtime-policy.service';
export declare class DoctorsService {
    private readonly repo;
    private readonly databaseDialect;
    private readonly runtimePolicy;
    constructor(repo: Repository<Doctor>, databaseDialect: DatabaseDialectService, runtimePolicy: RuntimePolicyService);
    private normalizeStatusFilter;
    private normalizeSearchValue;
    private normalizePhoneValue;
    private normalizeEmailValue;
    private get isSqlite();
    private buildNormalizedSql;
    private buildDigitsOnlySql;
    private buildLowerTrimSql;
    private buildFullNameSql;
    private findByIdOrFail;
    private findDoctorDuplicateByLicense;
    private findDoctorDuplicateByNameAndEmail;
    private findDoctorDuplicateByNameAndPhone;
    private findDoctorDuplicateByNameAndSpecialty;
    private findDoctorDuplicateByNameOnly;
    private assertNoDuplicateDoctor;
    search(search: string, page?: number, limit?: number, status?: string): Promise<{
        data: Doctor[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    create(dto: CreateDoctorDto): Promise<Doctor>;
    findOne(id: number): Promise<Doctor>;
    update(id: number, dto: UpdateDoctorDto): Promise<Doctor>;
    softDelete(id: number): Promise<{
        message: string;
    }>;
    updateStatus(id: number, dto: UpdateDoctorStatusDto): Promise<Doctor>;
    hardDelete(id: number): Promise<{
        message: string;
    }>;
    existsByLicense(licenseNumber: string): Promise<{
        exists: boolean;
        doctorId: number | null;
    }>;
}
