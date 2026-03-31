import { SyncMetadataEntity } from '../../common/entities/sync-metadata.entity';
export declare class Doctor extends SyncMetadataEntity {
    id: number;
    firstName: string;
    lastName: string;
    middleName?: string;
    email?: string;
    phone?: string;
    specialty?: string;
    licenseNumber?: string;
    notes?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
