import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { ServiceOrder, ServiceOrderItem, ServiceStatus } from './entities/service-order.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UpdateServiceStatusDto } from './dto/update-service-status.dto';
import { Patient } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Study } from '../studies/entities/study.entity';
import { DatabaseDialectService } from '../database/database-dialect.service';
import { RuntimePolicyService } from '../runtime/runtime-policy.service';
export declare class ServicesService {
    private readonly serviceRepo;
    private readonly itemRepo;
    private readonly patientRepo;
    private readonly doctorRepo;
    private readonly studyRepo;
    private readonly configService;
    private readonly databaseDialect;
    private readonly runtimePolicy;
    constructor(serviceRepo: Repository<ServiceOrder>, itemRepo: Repository<ServiceOrderItem>, patientRepo: Repository<Patient>, doctorRepo: Repository<Doctor>, studyRepo: Repository<Study>, configService: ConfigService, databaseDialect: DatabaseDialectService, runtimePolicy: RuntimePolicyService);
    private toNumber;
    private getLabBillingDocumentConfig;
    private getPriceByType;
    private formatDateShort;
    private formatReceiptDateTime;
    private formatMoney;
    private normalizeSearchText;
    private sqlNormalizedExpression;
    private get isSqlite();
    private getLabDateToken;
    private buildAutoServiceFolio;
    private extractAutoSequenceValue;
    private isUniqueConstraintError;
    private getNextAutoServiceFolio;
    private normalizeServiceFolio;
    private calculateTotals;
    private findActivePatientOrFail;
    private findActiveDoctorOrFail;
    getSuggestedFolio(): Promise<{
        folio: string;
    }>;
    private mapPriceTypeLabel;
    private formatGenderLabel;
    private truncateText;
    private buildReceiptBarcodeText;
    private buildBarcodeBuffer;
    private sanitizeBarcodeToken;
    private buildReceiptPdfBuffer;
    private buildTicketPdfBuffer;
    private buildLabelsPdfBuffer;
    private buildServiceItems;
    private getServiceItemIdentityKey;
    private reconcileServiceItems;
    create(dto: CreateServiceDto): Promise<ServiceOrder>;
    findOne(id: number): Promise<ServiceOrder>;
    findByFolio(folio: string): Promise<ServiceOrder>;
    search(params: {
        search?: string;
        status?: ServiceStatus;
        branchName?: string;
        fromDate?: string;
        toDate?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: ServiceOrder[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    update(id: number, dto: UpdateServiceDto): Promise<ServiceOrder>;
    updateStatus(id: number, dto: UpdateServiceStatusDto): Promise<ServiceOrder>;
    softDelete(id: number): Promise<{
        message: string;
    }>;
    hardDelete(id: number): Promise<{
        message: string;
    }>;
    generateReceiptPdf(id: number): Promise<Buffer<ArrayBufferLike>>;
    generateTubeLabelsPdf(id: number): Promise<Buffer<ArrayBufferLike>>;
    generateTicketPdf(id: number): Promise<Buffer<ArrayBufferLike>>;
}
