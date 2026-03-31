import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UpdateServiceStatusDto } from './dto/update-service-status.dto';
import { ServiceStatus } from './entities/service-order.entity';
import { Response } from 'express';
import { DocumentArtifactService } from '../storage/document-artifact.service';
export declare class ServicesController {
    private readonly servicesService;
    private readonly documentArtifacts;
    constructor(servicesService: ServicesService, documentArtifacts: DocumentArtifactService);
    create(dto: CreateServiceDto): Promise<{
        message: string;
        data: import("./entities/service-order.entity").ServiceOrder;
    }>;
    search(search?: string, status?: ServiceStatus, branchName?: string, fromDate?: string, toDate?: string, page?: string, limit?: string): Promise<{
        data: import("./entities/service-order.entity").ServiceOrder[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
    getSuggestedFolio(): Promise<{
        folio: string;
    }>;
    findOne(id: number): Promise<import("./entities/service-order.entity").ServiceOrder>;
    downloadReceipt(id: number, res: Response): Promise<void>;
    downloadLabels(id: number, res: Response): Promise<void>;
    downloadTicket(id: number, res: Response): Promise<void>;
    findByFolio(folio: string): Promise<import("./entities/service-order.entity").ServiceOrder>;
    update(id: number, dto: UpdateServiceDto): Promise<{
        message: string;
        data: import("./entities/service-order.entity").ServiceOrder;
    }>;
    updateStatus(id: number, dto: UpdateServiceStatusDto): Promise<{
        message: string;
        data: import("./entities/service-order.entity").ServiceOrder;
    }>;
    remove(id: number): Promise<{
        message: string;
    }>;
    hardRemove(id: number): Promise<{
        message: string;
    }>;
}
