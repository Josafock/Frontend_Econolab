export type DailyClosingServiceSnapshot = {
    serviceId: number;
    folio: string;
    patientName: string;
    patientPhone?: string | null;
    doctorName?: string | null;
    studySummary: string;
    studiesCount?: number;
    branchName: string;
    sampleAt?: string | null;
    completedAt?: string | null;
    createdAt?: string | null;
    deliveryAt?: string | null;
    subtotalAmount: number;
    discountAmount: number;
    totalAmount: number;
};
export type DailyClosingBranchSnapshot = {
    branchName: string;
    servicesCount: number;
    revenueTotal: number;
};
export type DailyClosingStudySnapshot = {
    studyName: string;
    times: number;
};
export type DailyClosingHourSnapshot = {
    hour: string;
    servicesCount: number;
    revenueTotal: number;
};
export declare class DailyClosing {
    id: number;
    closingDate: string;
    periodStart: Date;
    periodEnd: Date;
    servicesCount: number;
    patientsCount: number;
    studiesCount: number;
    subtotalAmount: number;
    discountAmount: number;
    totalAmount: number;
    averageTicket: number;
    branchBreakdown: DailyClosingBranchSnapshot[];
    topStudies: DailyClosingStudySnapshot[];
    hourlyBreakdown: DailyClosingHourSnapshot[];
    servicesSnapshot: DailyClosingServiceSnapshot[];
    createdAt: Date;
    updatedAt: Date;
}
