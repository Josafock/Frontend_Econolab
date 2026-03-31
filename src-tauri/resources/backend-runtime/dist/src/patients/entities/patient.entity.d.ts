import { SyncMetadataEntity } from '../../common/entities/sync-metadata.entity';
export declare enum PatientGender {
    MALE = "male",
    FEMALE = "female",
    OTHER = "other"
}
export declare class Patient extends SyncMetadataEntity {
    id: number;
    firstName: string;
    lastName: string;
    middleName?: string;
    gender: PatientGender;
    birthDate: string;
    phone?: string;
    email?: string;
    addressLine?: string;
    addressBetween?: string;
    addressCity?: string;
    addressState?: string;
    addressZip?: string;
    documentType?: string;
    documentNumber?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
