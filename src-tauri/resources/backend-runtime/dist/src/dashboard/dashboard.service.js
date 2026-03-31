"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_login_log_entity_1 = require("../auth/entities/user-login-log.entity");
const lab_date_util_1 = require("../common/utils/lab-date.util");
const roles_enum_1 = require("../common/enums/roles.enum");
const number_util_1 = require("../common/utils/number.util");
const person_util_1 = require("../common/utils/person.util");
const service_order_summary_util_1 = require("../common/utils/service-order-summary.util");
const doctor_entity_1 = require("../doctors/entities/doctor.entity");
const daily_closing_entity_1 = require("../history/entities/daily-closing.entity");
const patient_entity_1 = require("../patients/entities/patient.entity");
const service_order_entity_1 = require("../services/entities/service-order.entity");
const study_entity_1 = require("../studies/entities/study.entity");
const user_entity_1 = require("../users/entities/user.entity");
const database_dialect_service_1 = require("../database/database-dialect.service");
let DashboardService = class DashboardService {
    serviceRepo;
    userRepo;
    loginLogRepo;
    doctorRepo;
    dailyClosingRepo;
    patientRepo;
    studyRepo;
    databaseDialect;
    labTimeZone = 'America/Mexico_City';
    constructor(serviceRepo, userRepo, loginLogRepo, doctorRepo, dailyClosingRepo, patientRepo, studyRepo, databaseDialect) {
        this.serviceRepo = serviceRepo;
        this.userRepo = userRepo;
        this.loginLogRepo = loginLogRepo;
        this.doctorRepo = doctorRepo;
        this.dailyClosingRepo = dailyClosingRepo;
        this.patientRepo = patientRepo;
        this.studyRepo = studyRepo;
        this.databaseDialect = databaseDialect;
    }
    toNumber(value) {
        return (0, number_util_1.toFiniteNumber)(value);
    }
    getLabDateInput(value = new Date()) {
        return (0, lab_date_util_1.getLabDateInput)(this.labTimeZone, value);
    }
    getLocalDateExpression(expression) {
        return this.databaseDialect.getLocalDateExpression(this.labTimeZone, expression);
        return (0, lab_date_util_1.getLocalDateExpression)(this.labTimeZone, expression);
    }
    getMonthKey(value) {
        return (0, lab_date_util_1.getMonthKey)(this.labTimeZone, value);
    }
    parseDateInput(value) {
        if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value))
            return null;
        const parsed = new Date(`${value}T00:00:00`);
        if (Number.isNaN(parsed.getTime()))
            return null;
        return value;
    }
    getDateDistanceInDays(startDate, endDate) {
        const start = new Date(`${startDate}T00:00:00`);
        const end = new Date(`${endDate}T00:00:00`);
        const diff = end.getTime() - start.getTime();
        return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000))) + 1;
    }
    getRangeConfig(rangeInput, startDateInput, endDateInput) {
        const allowed = [
            'today',
            '7d',
            '30d',
            '90d',
            'year',
            'custom',
        ];
        const requestedRange = allowed.includes(rangeInput)
            ? rangeInput
            : 'today';
        const today = new Date();
        const end = new Date(today);
        const start = new Date(today);
        if (requestedRange === '7d') {
            start.setDate(start.getDate() - 6);
        }
        else if (requestedRange === '30d') {
            start.setDate(start.getDate() - 29);
        }
        else if (requestedRange === '90d') {
            start.setDate(start.getDate() - 89);
        }
        else if (requestedRange === 'year') {
            start.setDate(start.getDate() - 364);
        }
        const customStart = this.parseDateInput(startDateInput);
        const customEnd = this.parseDateInput(endDateInput);
        if (requestedRange === 'custom' && customStart && customEnd) {
            const normalizedStart = customStart <= customEnd ? customStart : customEnd;
            const normalizedEnd = customStart <= customEnd ? customEnd : customStart;
            const spanDays = this.getDateDistanceInDays(normalizedStart, normalizedEnd);
            return {
                range: 'custom',
                startDate: normalizedStart,
                endDate: normalizedEnd,
                label: 'Rango personalizado',
                trendGrouping: spanDays > 120 ? 'month' : 'day',
            };
        }
        const range = requestedRange === 'custom' ? 'today' : requestedRange;
        const startDate = range === 'today'
            ? this.getLabDateInput(end)
            : this.getLabDateInput(start);
        const endDate = this.getLabDateInput(end);
        const labels = {
            today: 'Hoy',
            '7d': 'Ultimos 7 dias',
            '30d': 'Ultimos 30 dias',
            '90d': 'Ultimos 3 meses',
            year: 'Ultimo año',
        };
        return {
            range,
            startDate,
            endDate,
            label: labels[range],
            trendGrouping: range === 'year' ? 'month' : 'day',
        };
    }
    getRoleFilter(roleInput) {
        return roleInput === 'admin' || roleInput === 'recepcionista'
            ? roleInput
            : 'all';
    }
    summarizeStudies(service) {
        return (0, service_order_summary_util_1.summarizeServiceStudies)(service);
    }
    buildStudyRanking(services) {
        const counts = new Map();
        for (const service of services) {
            for (const item of service.items ?? []) {
                const studyName = item.studyNameSnapshot ?? 'Sin estudio';
                counts.set(studyName, (counts.get(studyName) ?? 0) + 1);
            }
        }
        const ranked = [...counts.entries()]
            .map(([studyName, times]) => ({ studyName, times }))
            .sort((a, b) => b.times - a.times || a.studyName.localeCompare(b.studyName));
        return {
            ranked,
            top: ranked[0] ?? null,
            bottom: ranked.length > 0 ? ranked[ranked.length - 1] : null,
        };
    }
    buildBranchSummary(services) {
        const branches = new Map();
        for (const service of services) {
            const branchName = service.branchName ?? 'Sin sucursal';
            const current = branches.get(branchName) ?? {
                branchName,
                servicesCount: 0,
                revenueTotal: 0,
            };
            current.servicesCount += 1;
            current.revenueTotal += this.toNumber(service.totalAmount);
            branches.set(branchName, current);
        }
        return [...branches.values()].sort((a, b) => b.revenueTotal - a.revenueTotal);
    }
    buildDoctorName(doctor) {
        if (!doctor) {
            return 'Sin medico';
        }
        return ((0, person_util_1.buildPersonName)(doctor.firstName, doctor.lastName, doctor.middleName) ||
            'Sin medico');
    }
    buildDoctorPerformance(services) {
        const doctors = new Map();
        for (const service of services) {
            const doctorName = this.buildDoctorName(service.doctor);
            const current = doctors.get(doctorName) ?? {
                doctorName,
                servicesCount: 0,
                revenueTotal: 0,
            };
            current.servicesCount += 1;
            current.revenueTotal += this.toNumber(service.totalAmount);
            doctors.set(doctorName, current);
        }
        return [...doctors.values()].sort((a, b) => b.servicesCount - a.servicesCount ||
            b.revenueTotal - a.revenueTotal ||
            a.doctorName.localeCompare(b.doctorName));
    }
    buildTrend(services, grouping) {
        const buckets = new Map();
        for (const service of services) {
            const completedAt = service.completedAt ??
                service.updatedAt ??
                service.createdAt ??
                new Date();
            const key = grouping === 'month'
                ? this.getMonthKey(completedAt)
                : this.getLabDateInput(completedAt);
            const current = buckets.get(key) ?? {
                key,
                revenueTotal: 0,
                servicesCount: 0,
            };
            current.revenueTotal += this.toNumber(service.totalAmount);
            current.servicesCount += 1;
            buckets.set(key, current);
        }
        return [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key));
    }
    async getOverview(rangeInput, roleInput, startDateInput, endDateInput) {
        const rangeConfig = this.getRangeConfig(rangeInput, startDateInput, endDateInput);
        const roleFilter = this.getRoleFilter(roleInput);
        const createdLocalDateExpr = this.getLocalDateExpression('s.createdAt');
        const completedLocalDateExpr = this.getLocalDateExpression('coalesce(s.completedAt, s.updatedAt, s.createdAt)');
        const loginLocalDateExpr = this.getLocalDateExpression('log.created_at');
        const [createdServicesInRange, completedServicesInRange, totalServicesCount, todayCreatedServicesCount, todayCompletedServices, pendingCount, inProgressCount, delayedCount, cancelledInRangeCount, totalPatientsCount, totalDoctorsCount, activeStudiesCount, users, rangeLoginLogs, recentLoginLogs, savedTodayCut,] = await Promise.all([
            this.serviceRepo
                .createQueryBuilder('s')
                .leftJoinAndSelect('s.patient', 'p')
                .leftJoinAndSelect('s.doctor', 'd')
                .leftJoinAndSelect('s.items', 'i')
                .where('s.isActive = :active', { active: true })
                .andWhere(`${createdLocalDateExpr} >= :startDate`, {
                startDate: rangeConfig.startDate,
            })
                .andWhere(`${createdLocalDateExpr} <= :endDate`, {
                endDate: rangeConfig.endDate,
            })
                .orderBy('s.createdAt', 'DESC')
                .getMany(),
            this.serviceRepo
                .createQueryBuilder('s')
                .leftJoinAndSelect('s.patient', 'p')
                .leftJoinAndSelect('s.doctor', 'd')
                .leftJoinAndSelect('s.items', 'i')
                .where('s.isActive = :active', { active: true })
                .andWhere('s.status = :status', { status: service_order_entity_1.ServiceStatus.COMPLETED })
                .andWhere(`${completedLocalDateExpr} >= :startDate`, {
                startDate: rangeConfig.startDate,
            })
                .andWhere(`${completedLocalDateExpr} <= :endDate`, {
                endDate: rangeConfig.endDate,
            })
                .orderBy('coalesce(s.completedAt, s.updatedAt, s.createdAt)', 'DESC')
                .getMany(),
            this.serviceRepo.count({
                where: { isActive: true },
            }),
            this.serviceRepo
                .createQueryBuilder('s')
                .where('s.isActive = :active', { active: true })
                .andWhere(`${createdLocalDateExpr} = :todayDate`, {
                todayDate: this.getLabDateInput(),
            })
                .getCount(),
            this.serviceRepo
                .createQueryBuilder('s')
                .leftJoinAndSelect('s.patient', 'p')
                .leftJoinAndSelect('s.doctor', 'd')
                .leftJoinAndSelect('s.items', 'i')
                .where('s.isActive = :active', { active: true })
                .andWhere('s.status = :status', { status: service_order_entity_1.ServiceStatus.COMPLETED })
                .andWhere(`${completedLocalDateExpr} = :todayDate`, {
                todayDate: this.getLabDateInput(),
            })
                .orderBy('coalesce(s.completedAt, s.updatedAt, s.createdAt)', 'DESC')
                .getMany(),
            this.serviceRepo.count({
                where: { isActive: true, status: service_order_entity_1.ServiceStatus.PENDING },
            }),
            this.serviceRepo.count({
                where: { isActive: true, status: service_order_entity_1.ServiceStatus.IN_PROGRESS },
            }),
            this.serviceRepo.count({
                where: { isActive: true, status: service_order_entity_1.ServiceStatus.DELAYED },
            }),
            this.serviceRepo
                .createQueryBuilder('s')
                .where('s.isActive = :active', { active: true })
                .andWhere('s.status = :status', { status: service_order_entity_1.ServiceStatus.CANCELLED })
                .andWhere(`${createdLocalDateExpr} >= :startDate`, {
                startDate: rangeConfig.startDate,
            })
                .andWhere(`${createdLocalDateExpr} <= :endDate`, {
                endDate: rangeConfig.endDate,
            })
                .getCount(),
            this.patientRepo.count({
                where: { isActive: true },
            }),
            this.doctorRepo.count({
                where: { isActive: true },
            }),
            this.studyRepo.count({
                where: { isActive: true, status: study_entity_1.StudyStatus.ACTIVE },
            }),
            this.userRepo.find({
                where: [
                    { confirmed: true, rol: roles_enum_1.Role.Admin },
                    { confirmed: true, rol: roles_enum_1.Role.Recepcionista },
                ],
                order: { nombre: 'ASC' },
            }),
            this.loginLogRepo
                .createQueryBuilder('log')
                .leftJoinAndSelect('log.user', 'u')
                .where(`${loginLocalDateExpr} >= :startDate`, {
                startDate: rangeConfig.startDate,
            })
                .andWhere(`${loginLocalDateExpr} <= :endDate`, {
                endDate: rangeConfig.endDate,
            })
                .orderBy('log.createdAt', 'DESC')
                .getMany(),
            this.loginLogRepo.find({
                relations: ['user'],
                order: { createdAt: 'DESC' },
                take: 12,
            }),
            this.dailyClosingRepo.findOne({
                where: { closingDate: this.getLabDateInput() },
            }),
        ]);
        const revenueInRange = completedServicesInRange.reduce((acc, service) => acc + this.toNumber(service.totalAmount), 0);
        const todayRevenue = todayCompletedServices.reduce((acc, service) => acc + this.toNumber(service.totalAmount), 0);
        const studyRanking = this.buildStudyRanking(createdServicesInRange);
        const branchSummary = this.buildBranchSummary(completedServicesInRange);
        const doctorPerformance = this.buildDoctorPerformance(createdServicesInRange);
        const trend = this.buildTrend(completedServicesInRange, rangeConfig.trendGrouping);
        const successfulLogins = rangeLoginLogs.filter((log) => log.success);
        const failedLogins = rangeLoginLogs.filter((log) => !log.success);
        const uniqueUsers = new Set(successfulLogins
            .map((log) => log.user?.id)
            .filter((value) => Boolean(value))).size;
        const loginStatsByUser = new Map();
        for (const log of rangeLoginLogs) {
            const userId = log.user?.id;
            if (!userId)
                continue;
            const current = loginStatsByUser.get(userId) ?? {
                successfulLogins: 0,
                failedLogins: 0,
                lastLoginAt: null,
                lastAttemptAt: null,
            };
            if (log.success) {
                current.successfulLogins += 1;
                if (!current.lastLoginAt || log.createdAt > current.lastLoginAt) {
                    current.lastLoginAt = log.createdAt;
                }
            }
            else {
                current.failedLogins += 1;
            }
            if (!current.lastAttemptAt || log.createdAt > current.lastAttemptAt) {
                current.lastAttemptAt = log.createdAt;
            }
            loginStatsByUser.set(userId, current);
        }
        const roleCounts = {
            admin: users.filter((user) => user.rol === roles_enum_1.Role.Admin).length,
            recepcionista: users.filter((user) => user.rol === roles_enum_1.Role.Recepcionista)
                .length,
        };
        const filteredUsers = users.filter((user) => roleFilter === 'all' ? true : user.rol === roleFilter);
        return {
            generatedAt: new Date().toISOString(),
            filters: {
                range: rangeConfig.range,
                rangeLabel: rangeConfig.label,
                startDate: rangeConfig.startDate,
                endDate: rangeConfig.endDate,
                role: roleFilter,
            },
            welcome: {
                title: 'Inicio del laboratorio',
                subtitle: 'Monitorea ingresos, demanda, actividad de usuarios y salud operativa del laboratorio desde un solo lugar.',
            },
            kpis: {
                revenueInRange,
                createdServicesInRange: createdServicesInRange.length,
                completedServicesInRange: completedServicesInRange.length,
                totalServices: totalServicesCount,
                createdServicesToday: todayCreatedServicesCount,
                completedServicesToday: todayCompletedServices.length,
                todayRevenue,
                pendingServices: pendingCount,
                inProgressServices: inProgressCount,
                delayedServices: delayedCount,
                cancelledServicesInRange: cancelledInRangeCount,
                totalPatients: totalPatientsCount,
                totalDoctors: totalDoctorsCount,
                activeStudies: activeStudiesCount,
                totalUsers: users.length,
                adminUsers: roleCounts.admin,
                receptionistUsers: roleCounts.recepcionista,
            },
            studies: {
                topInRange: studyRanking.top,
                bottomInRange: studyRanking.bottom,
                rankingInRange: studyRanking.ranked.slice(0, 10),
            },
            branches: {
                strongestInRange: branchSummary[0] ?? null,
                breakdownInRange: branchSummary,
            },
            doctors: {
                topInRange: doctorPerformance[0] ?? null,
                rankingInRange: doctorPerformance.slice(0, 6),
            },
            logins: {
                successfulInRange: successfulLogins.length,
                failedInRange: failedLogins.length,
                uniqueUsersInRange: uniqueUsers,
                recent: recentLoginLogs.map((log) => ({
                    id: log.id,
                    success: log.success,
                    createdAt: log.createdAt,
                    userName: log.user?.nombre ?? null,
                    email: log.user?.email ?? log.emailIntent ?? null,
                    ip: log.ip ?? null,
                    userAgent: log.userAgent ?? null,
                })),
                users: filteredUsers.map((user) => {
                    const stats = loginStatsByUser.get(user.id);
                    return {
                        id: user.id,
                        nombre: user.nombre,
                        email: user.email,
                        rol: user.rol,
                        confirmed: user.confirmed,
                        createdAt: user.createdAt,
                        successfulLogins: stats?.successfulLogins ?? 0,
                        failedLogins: stats?.failedLogins ?? 0,
                        lastLoginAt: stats?.lastLoginAt ?? null,
                        lastAttemptAt: stats?.lastAttemptAt ?? null,
                    };
                }),
            },
            finance: {
                savedTodayCut: savedTodayCut
                    ? {
                        id: savedTodayCut.id,
                        closingDate: savedTodayCut.closingDate,
                        totalAmount: this.toNumber(savedTodayCut.totalAmount),
                        servicesCount: savedTodayCut.servicesCount,
                        updatedAt: savedTodayCut.updatedAt,
                    }
                    : null,
            },
            trends: {
                revenueSeries: trend,
            },
            operations: {
                latestCompletedServices: completedServicesInRange
                    .slice(0, 8)
                    .map((service) => ({
                    id: service.id,
                    folio: service.folio,
                    patientName: service.patient
                        ? `${service.patient.firstName} ${service.patient.lastName} ${service.patient.middleName ?? ''}`.trim()
                        : 'Sin paciente',
                    studySummary: this.summarizeStudies(service),
                    totalAmount: this.toNumber(service.totalAmount),
                    completedAt: service.completedAt ?? service.updatedAt ?? service.createdAt,
                })),
            },
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(service_order_entity_1.ServiceOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(user_login_log_entity_1.UserLoginLog)),
    __param(3, (0, typeorm_1.InjectRepository)(doctor_entity_1.Doctor)),
    __param(4, (0, typeorm_1.InjectRepository)(daily_closing_entity_1.DailyClosing)),
    __param(5, (0, typeorm_1.InjectRepository)(patient_entity_1.Patient)),
    __param(6, (0, typeorm_1.InjectRepository)(study_entity_1.Study)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        database_dialect_service_1.DatabaseDialectService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map