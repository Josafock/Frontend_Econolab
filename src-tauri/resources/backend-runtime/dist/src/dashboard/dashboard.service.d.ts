import { Repository } from 'typeorm';
import { UserLoginLog } from '../auth/entities/user-login-log.entity';
import { Role } from '../common/enums/roles.enum';
import { Doctor } from '../doctors/entities/doctor.entity';
import { DailyClosing } from '../history/entities/daily-closing.entity';
import { Patient } from '../patients/entities/patient.entity';
import { ServiceOrder } from '../services/entities/service-order.entity';
import { Study } from '../studies/entities/study.entity';
import { User } from '../users/entities/user.entity';
import { DatabaseDialectService } from '../database/database-dialect.service';
type DashboardRoleFilter = 'all' | 'admin' | 'recepcionista';
export declare class DashboardService {
    private readonly serviceRepo;
    private readonly userRepo;
    private readonly loginLogRepo;
    private readonly doctorRepo;
    private readonly dailyClosingRepo;
    private readonly patientRepo;
    private readonly studyRepo;
    private readonly databaseDialect;
    private readonly labTimeZone;
    constructor(serviceRepo: Repository<ServiceOrder>, userRepo: Repository<User>, loginLogRepo: Repository<UserLoginLog>, doctorRepo: Repository<Doctor>, dailyClosingRepo: Repository<DailyClosing>, patientRepo: Repository<Patient>, studyRepo: Repository<Study>, databaseDialect: DatabaseDialectService);
    private toNumber;
    private getLabDateInput;
    private getLocalDateExpression;
    private getMonthKey;
    private parseDateInput;
    private getDateDistanceInDays;
    private getRangeConfig;
    private getRoleFilter;
    private summarizeStudies;
    private buildStudyRanking;
    private buildBranchSummary;
    private buildDoctorName;
    private buildDoctorPerformance;
    private buildTrend;
    getOverview(rangeInput?: string, roleInput?: string, startDateInput?: string, endDateInput?: string): Promise<{
        generatedAt: string;
        filters: {
            range: "year" | "30d" | "today" | "7d" | "90d" | "custom";
            rangeLabel: string;
            startDate: string;
            endDate: string;
            role: DashboardRoleFilter;
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
export {};
