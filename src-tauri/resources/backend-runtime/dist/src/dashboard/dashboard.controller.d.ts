import { Role } from '../common/enums/roles.enum';
import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getOverview(range?: string, role?: string, startDate?: string, endDate?: string): Promise<{
        generatedAt: string;
        filters: {
            range: "year" | "30d" | "today" | "7d" | "90d" | "custom";
            rangeLabel: string;
            startDate: string;
            endDate: string;
            role: "admin" | "recepcionista" | "all";
        };
        welcome: {
            title: string;
            subtitle: string;
        };
        kpis: {
            revenueInRange: number;
            createdServicesInRange: number;
            completedServicesInRange: number;
            totalServices: number;
            createdServicesToday: number;
            completedServicesToday: number;
            todayRevenue: number;
            pendingServices: number;
            inProgressServices: number;
            delayedServices: number;
            cancelledServicesInRange: number;
            totalPatients: number;
            totalDoctors: number;
            activeStudies: number;
            totalUsers: number;
            adminUsers: number;
            receptionistUsers: number;
        };
        studies: {
            topInRange: {
                studyName: string;
                times: number;
            };
            bottomInRange: {
                studyName: string;
                times: number;
            } | null;
            rankingInRange: {
                studyName: string;
                times: number;
            }[];
        };
        branches: {
            strongestInRange: {
                branchName: string;
                servicesCount: number;
                revenueTotal: number;
            };
            breakdownInRange: {
                branchName: string;
                servicesCount: number;
                revenueTotal: number;
            }[];
        };
        doctors: {
            topInRange: {
                doctorName: string;
                servicesCount: number;
                revenueTotal: number;
            };
            rankingInRange: {
                doctorName: string;
                servicesCount: number;
                revenueTotal: number;
            }[];
        };
        logins: {
            successfulInRange: number;
            failedInRange: number;
            uniqueUsersInRange: number;
            recent: {
                id: string | number;
                success: boolean;
                createdAt: Date;
                userName: string | null;
                email: string | null;
                ip: string | null;
                userAgent: string | null;
            }[];
            users: {
                id: string;
                nombre: string;
                email: string;
                rol: Role;
                confirmed: boolean;
                createdAt: Date;
                successfulLogins: number;
                failedLogins: number;
                lastLoginAt: Date | null;
                lastAttemptAt: Date | null;
            }[];
        };
        finance: {
            savedTodayCut: {
                id: number;
                closingDate: string;
                totalAmount: number;
                servicesCount: number;
                updatedAt: Date;
            } | null;
        };
        trends: {
            revenueSeries: {
                key: string;
                revenueTotal: number;
                servicesCount: number;
            }[];
        };
        operations: {
            latestCompletedServices: {
                id: number;
                folio: string;
                patientName: string;
                studySummary: string;
                totalAmount: number;
                completedAt: Date;
            }[];
        };
    }>;
}
