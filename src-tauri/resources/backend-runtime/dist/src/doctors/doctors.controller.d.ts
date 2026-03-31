import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorStatusDto } from './dto/update-doctor-status.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorsService } from './doctors.service';
export declare class DoctorsController {
    private readonly doctorsService;
    constructor(doctorsService: DoctorsService);
    search(search?: string, page?: number, limit?: number, status?: string): Promise<{
        data: import("./entities/doctor.entity").Doctor[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    exists(licenseNumber: string): Promise<{
        exists: boolean;
        doctorId: number | null;
    }>;
    create(dto: CreateDoctorDto): Promise<{
        message: string;
        data: import("./entities/doctor.entity").Doctor;
    }>;
    findOne(id: string): Promise<import("./entities/doctor.entity").Doctor>;
    update(id: string, dto: UpdateDoctorDto): Promise<{
        message: string;
        data: import("./entities/doctor.entity").Doctor;
    }>;
    updateStatus(id: string, dto: UpdateDoctorStatusDto): Promise<{
        message: string;
        data: import("./entities/doctor.entity").Doctor;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    hardRemove(id: string): Promise<{
        message: string;
    }>;
}
