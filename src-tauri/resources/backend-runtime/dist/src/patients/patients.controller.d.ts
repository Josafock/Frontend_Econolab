import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientStatusDto } from './dto/update-patient-status.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';
export declare class PatientsController {
    private readonly patientsService;
    constructor(patientsService: PatientsService);
    search(search?: string, page?: number, limit?: number, status?: string): Promise<{
        data: import("./entities/patient.entity").Patient[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    exists(documentType: string, documentNumber: string): Promise<{
        exists: boolean;
        patientId: number | null;
    }>;
    create(dto: CreatePatientDto): Promise<{
        message: string;
        data: import("./entities/patient.entity").Patient;
    }>;
    findOne(id: string): Promise<import("./entities/patient.entity").Patient>;
    update(id: string, dto: UpdatePatientDto): Promise<{
        message: string;
        data: import("./entities/patient.entity").Patient;
    }>;
    updateStatus(id: string, dto: UpdatePatientStatusDto): Promise<{
        message: string;
        data: import("./entities/patient.entity").Patient;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
