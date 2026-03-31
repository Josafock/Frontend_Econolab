import { ServiceStatus } from '../entities/service-order.entity';
import { CreateServiceItemDto } from './service-item.dto';
export declare class CreateServiceDto {
    folio?: string;
    autoGenerateFolio?: boolean;
    patientId: number;
    doctorId?: number;
    branchName?: string;
    sampleAt?: string;
    deliveryAt?: string;
    status?: ServiceStatus;
    courtesyPercent?: number;
    notes?: string;
    items: CreateServiceItemDto[];
}
