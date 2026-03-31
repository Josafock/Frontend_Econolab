import { Patient } from '../../patients/entities/patient.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { SyncMetadataEntity } from '../../common/entities/sync-metadata.entity';
export declare enum ServiceStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    DELAYED = "delayed",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare class ServiceOrder extends SyncMetadataEntity {
    id: number;
    folio: string;
    patient: Patient;
    patientId: number;
    doctor?: Doctor;
    doctorId?: number;
    branchName?: string;
    sampleAt?: Date;
    deliveryAt?: Date;
    completedAt?: Date;
    status: ServiceStatus;
    subtotalAmount: number;
    courtesyPercent: number;
    discountAmount: number;
    totalAmount: number;
    notes?: string;
    isActive: boolean;
    items: ServiceOrderItem[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class ServiceOrderItem extends SyncMetadataEntity {
    id: number;
    serviceOrder: ServiceOrder;
    serviceOrderId: number;
    studyId: number;
    studyNameSnapshot: string;
    sourcePackageId?: number;
    sourcePackageNameSnapshot?: string;
    priceType: ServiceItemPriceType;
    unitPrice: number;
    quantity: number;
    discountPercent: number;
    subtotalAmount: number;
}
export declare enum ServiceItemPriceType {
    NORMAL = "normal",
    DIF = "dif",
    SPECIAL = "special",
    HOSPITAL = "hospital",
    OTHER = "other"
}
