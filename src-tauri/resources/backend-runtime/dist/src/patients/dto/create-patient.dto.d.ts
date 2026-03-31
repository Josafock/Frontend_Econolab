import { PatientGender } from '../entities/patient.entity';
export declare class CreatePatientDto {
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
}
