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
exports.HistoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const lab_date_util_1 = require("../common/utils/lab-date.util");
const number_util_1 = require("../common/utils/number.util");
const person_util_1 = require("../common/utils/person.util");
const search_normalization_util_1 = require("../common/utils/search-normalization.util");
const service_order_summary_util_1 = require("../common/utils/service-order-summary.util");
const service_order_entity_1 = require("../services/entities/service-order.entity");
const daily_closing_entity_1 = require("./entities/daily-closing.entity");
const database_dialect_service_1 = require("../database/database-dialect.service");
const runtime_policy_service_1 = require("../runtime/runtime-policy.service");
let HistoryService = class HistoryService {
    serviceRepo;
    dailyClosingRepo;
    databaseDialect;
    runtimePolicy;
    labTimeZone = 'America/Mexico_City';
    labTimeZoneOffset = '-06:00';
    constructor(serviceRepo, dailyClosingRepo, databaseDialect, runtimePolicy) {
        this.serviceRepo = serviceRepo;
        this.dailyClosingRepo = dailyClosingRepo;
        this.databaseDialect = databaseDialect;
        this.runtimePolicy = runtimePolicy;
    }
    toNumber(value) {
        return (0, number_util_1.toFiniteNumber)(value);
    }
    normalizeSearchText(value) {
        return (0, search_normalization_util_1.normalizeCompactSearchText)(value);
    }
    sqlNormalizedExpression(expression) {
        return this.databaseDialect.buildCompactSearchExpression(expression);
        return (0, search_normalization_util_1.buildCompactSearchSqlExpression)(expression);
    }
    isValidDateInput(value) {
        return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
    }
    getLabDateInput(value = new Date()) {
        return (0, lab_date_util_1.getLabDateInput)(this.labTimeZone, value);
    }
    getLabHourLabel(value) {
        if (!value)
            return 'Sin hora';
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: this.labTimeZone,
            hour: '2-digit',
            hour12: false,
        });
        const parts = formatter.formatToParts(value);
        const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
        return `${hour}:00`;
    }
    getLabDateFromValue(value) {
        return this.getLabDateInput(value ?? new Date());
    }
    getDateRangeBounds(dateInput, fromDateInput, toDateInput) {
        const fallbackDate = this.getLabDateInput();
        const singleDate = this.isValidDateInput(dateInput)
            ? dateInput
            : undefined;
        let fromDate = this.isValidDateInput(fromDateInput)
            ? fromDateInput
            : (singleDate ?? fallbackDate);
        let toDate = this.isValidDateInput(toDateInput)
            ? toDateInput
            : (singleDate ?? fromDate);
        if (fromDate > toDate) {
            [fromDate, toDate] = [toDate, fromDate];
        }
        const start = new Date(`${fromDate}T00:00:00.000${this.labTimeZoneOffset}`);
        const end = new Date(`${toDate}T23:59:59.999${this.labTimeZoneOffset}`);
        return {
            selectedDate: singleDate ?? (fromDate === toDate ? fromDate : toDate),
            fromDate,
            toDate,
            start,
            end,
            isSingleDay: fromDate === toDate,
        };
    }
    getCompletedMoment(service) {
        return service.completedAt ?? service.updatedAt ?? service.createdAt;
    }
    summarizeStudies(service) {
        return (0, service_order_summary_util_1.summarizeServiceStudies)(service);
    }
    getDoctorName(service) {
        if (!service.doctor) {
            return null;
        }
        return ((0, person_util_1.buildPersonName)(service.doctor.firstName, service.doctor.lastName, service.doctor.middleName) || null);
    }
    mapServiceSnapshot(service) {
        const patientName = (0, person_util_1.buildPersonName)(service.patient?.firstName, service.patient?.lastName, service.patient?.middleName) || 'Sin paciente';
        return {
            serviceId: service.id,
            folio: service.folio,
            patientName,
            patientPhone: service.patient?.phone ?? null,
            doctorName: this.getDoctorName(service),
            studySummary: this.summarizeStudies(service),
            studiesCount: service.items?.length ?? 0,
            branchName: service.branchName ?? 'Sin sucursal',
            sampleAt: service.sampleAt?.toISOString() ?? null,
            completedAt: this.getCompletedMoment(service)?.toISOString() ?? null,
            createdAt: service.createdAt?.toISOString() ?? null,
            deliveryAt: service.deliveryAt?.toISOString() ?? null,
            subtotalAmount: this.toNumber(service.subtotalAmount),
            discountAmount: this.toNumber(service.discountAmount),
            totalAmount: this.toNumber(service.totalAmount),
        };
    }
    buildSummary(services) {
        const serviceSnapshots = services.map((service) => this.mapServiceSnapshot(service));
        const patientsCount = new Set(services.map((service) => service.patientId))
            .size;
        const studiesCount = services.reduce((acc, service) => acc + (service.items?.length ?? 0), 0);
        const subtotalAmount = services.reduce((acc, service) => acc + this.toNumber(service.subtotalAmount), 0);
        const discountAmount = services.reduce((acc, service) => acc + this.toNumber(service.discountAmount), 0);
        const totalAmount = services.reduce((acc, service) => acc + this.toNumber(service.totalAmount), 0);
        const averageTicket = services.length > 0 ? totalAmount / services.length : 0;
        const branchAccumulator = new Map();
        const studyAccumulator = new Map();
        const hourAccumulator = new Map();
        for (const service of services) {
            const branchName = service.branchName ?? 'Sin sucursal';
            const branchEntry = branchAccumulator.get(branchName) ?? {
                branchName,
                servicesCount: 0,
                revenueTotal: 0,
            };
            branchEntry.servicesCount += 1;
            branchEntry.revenueTotal += this.toNumber(service.totalAmount);
            branchAccumulator.set(branchName, branchEntry);
            for (const item of service.items ?? []) {
                const studyName = item.studyNameSnapshot ?? 'Sin estudio';
                studyAccumulator.set(studyName, (studyAccumulator.get(studyName) ?? 0) + 1);
            }
            const completedMoment = this.getCompletedMoment(service);
            const hourLabel = this.getLabHourLabel(completedMoment);
            const hourEntry = hourAccumulator.get(hourLabel) ?? {
                hour: hourLabel,
                servicesCount: 0,
                revenueTotal: 0,
            };
            hourEntry.servicesCount += 1;
            hourEntry.revenueTotal += this.toNumber(service.totalAmount);
            hourAccumulator.set(hourLabel, hourEntry);
        }
        const branchBreakdown = [
            ...branchAccumulator.values(),
        ].sort((a, b) => b.revenueTotal - a.revenueTotal);
        const topStudies = [
            ...studyAccumulator.entries(),
        ]
            .map(([studyName, times]) => ({ studyName, times }))
            .sort((a, b) => b.times - a.times)
            .slice(0, 8);
        const hourlyBreakdown = [
            ...hourAccumulator.values(),
        ].sort((a, b) => a.hour.localeCompare(b.hour));
        return {
            servicesCount: services.length,
            patientsCount,
            studiesCount,
            subtotalAmount,
            discountAmount,
            totalAmount,
            averageTicket,
            branchBreakdown,
            topStudies,
            hourlyBreakdown,
            servicesSnapshot: serviceSnapshots,
        };
    }
    mapDailyClosing(entity, includeSnapshot = false) {
        return {
            id: entity.id,
            closingDate: entity.closingDate,
            periodStart: entity.periodStart,
            periodEnd: entity.periodEnd,
            servicesCount: entity.servicesCount,
            patientsCount: entity.patientsCount,
            studiesCount: entity.studiesCount,
            subtotalAmount: this.toNumber(entity.subtotalAmount),
            discountAmount: this.toNumber(entity.discountAmount),
            totalAmount: this.toNumber(entity.totalAmount),
            averageTicket: this.toNumber(entity.averageTicket),
            branchBreakdown: entity.branchBreakdown ?? [],
            topStudies: entity.topStudies ?? [],
            hourlyBreakdown: entity.hourlyBreakdown ?? [],
            servicesSnapshot: includeSnapshot ? (entity.servicesSnapshot ?? []) : [],
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
    async getCompletedServicesForRange(fromDate, toDate, search) {
        const normalizedSearch = this.normalizeSearchText(search);
        const completedAtExpr = `coalesce(s.completedAt, s.updatedAt, s.createdAt)`;
        const labDateExpr = this.databaseDialect.getLocalDateExpression(this.labTimeZone, completedAtExpr);
        const completedSortAlias = 'history_completed_sort';
        const qb = this.serviceRepo
            .createQueryBuilder('s')
            .addSelect(completedAtExpr, completedSortAlias)
            .leftJoinAndSelect('s.patient', 'p')
            .leftJoinAndSelect('s.doctor', 'd')
            .leftJoinAndSelect('s.items', 'i')
            .where('s.isActive = :active', { active: true })
            .andWhere('s.status = :status', { status: service_order_entity_1.ServiceStatus.COMPLETED })
            .andWhere(`${labDateExpr} BETWEEN :fromDate AND :toDate`, {
            fromDate,
            toDate,
        })
            .distinct(true);
        if (normalizedSearch) {
            qb.andWhere(`(
          ${this.sqlNormalizedExpression('s.folio')} LIKE :normalizedSearch
          OR ${this.sqlNormalizedExpression("concat_ws(' ', p.firstName, p.lastName, p.middleName)")} LIKE :normalizedSearch
          OR ${this.sqlNormalizedExpression('i.studyNameSnapshot')} LIKE :normalizedSearch
        )`, { normalizedSearch: `%${normalizedSearch}%` });
        }
        qb.orderBy(completedSortAlias, 'DESC');
        return qb.getMany();
    }
    async getDashboard(date, search, fromDateInput, toDateInput) {
        const { selectedDate, fromDate, toDate, isSingleDay } = this.getDateRangeBounds(date, fromDateInput, toDateInput);
        const services = await this.getCompletedServicesForRange(fromDate, toDate, search);
        const summary = this.buildSummary(services);
        const savedCut = isSingleDay
            ? await this.dailyClosingRepo.findOne({
                where: { closingDate: fromDate },
            })
            : null;
        const recentCuts = await this.dailyClosingRepo.find({
            order: { closingDate: 'DESC' },
            take: 45,
        });
        return {
            selectedDate,
            fromDate,
            toDate,
            isSingleDay,
            services: services.map((service) => ({
                id: service.id,
                folio: service.folio,
                paciente: service.patient
                    ? `${service.patient.firstName} ${service.patient.lastName} ${service.patient.middleName ?? ''}`.trim()
                    : 'Sin paciente',
                telefono: service.patient?.phone ?? '-',
                medico: this.getDoctorName(service) ?? 'Sin medico',
                estudio: this.summarizeStudies(service),
                estudiosCount: service.items?.length ?? 0,
                sucursal: service.branchName ?? 'Sin sucursal',
                fechaMuestra: service.sampleAt,
                fechaCreacion: service.createdAt,
                fechaEntrega: service.deliveryAt,
                fechaConclusion: this.getCompletedMoment(service),
                subtotalAmount: this.toNumber(service.subtotalAmount),
                discountAmount: this.toNumber(service.discountAmount),
                totalAmount: this.toNumber(service.totalAmount),
                status: service.status,
            })),
            summary,
            savedCut: savedCut ? this.mapDailyClosing(savedCut) : null,
            recentCuts: recentCuts.map((cut) => this.mapDailyClosing(cut)),
        };
    }
    buildSummaryFromDailyClosing(closing) {
        return {
            servicesCount: closing.servicesCount,
            patientsCount: closing.patientsCount,
            studiesCount: closing.studiesCount,
            subtotalAmount: this.toNumber(closing.subtotalAmount),
            discountAmount: this.toNumber(closing.discountAmount),
            totalAmount: this.toNumber(closing.totalAmount),
            averageTicket: this.toNumber(closing.averageTicket),
            branchBreakdown: closing.branchBreakdown ?? [],
            topStudies: closing.topStudies ?? [],
            hourlyBreakdown: closing.hourlyBreakdown ?? [],
            servicesSnapshot: closing.servicesSnapshot ?? [],
        };
    }
    buildDailyOverviewRow(date, summary, savedCut) {
        const topStudy = summary.topStudies[0] ?? null;
        const strongestBranch = summary.branchBreakdown[0] ?? null;
        return {
            date,
            servicesCount: summary.servicesCount,
            patientsCount: summary.patientsCount,
            studiesCount: summary.studiesCount,
            subtotalAmount: summary.subtotalAmount,
            discountAmount: summary.discountAmount,
            totalAmount: summary.totalAmount,
            averageTicket: summary.averageTicket,
            topStudyName: topStudy?.studyName ?? null,
            topStudyTimes: topStudy?.times ?? 0,
            strongestBranchName: strongestBranch?.branchName ?? null,
            strongestBranchRevenue: strongestBranch?.revenueTotal ?? 0,
            savedCutId: savedCut?.id ?? null,
            savedCutUpdatedAt: savedCut?.updatedAt ?? null,
            isSaved: Boolean(savedCut),
        };
    }
    async generateDailyCut(date) {
        const { fromDate, start, end } = this.getDateRangeBounds(date, date, date);
        const services = await this.getCompletedServicesForRange(fromDate, fromDate);
        const summary = this.buildSummary(services);
        const existing = await this.dailyClosingRepo.findOne({
            where: { closingDate: fromDate },
        });
        const entity = this.dailyClosingRepo.create({
            id: existing?.id,
            closingDate: fromDate,
            periodStart: start,
            periodEnd: end,
            servicesCount: summary.servicesCount,
            patientsCount: summary.patientsCount,
            studiesCount: summary.studiesCount,
            subtotalAmount: summary.subtotalAmount,
            discountAmount: summary.discountAmount,
            totalAmount: summary.totalAmount,
            averageTicket: summary.averageTicket,
            branchBreakdown: summary.branchBreakdown,
            topStudies: summary.topStudies,
            hourlyBreakdown: summary.hourlyBreakdown,
            servicesSnapshot: summary.servicesSnapshot,
        });
        const saved = await this.dailyClosingRepo.save(entity);
        return this.mapDailyClosing(saved);
    }
    async getDailyCutsOverview(fromDateInput, toDateInput) {
        const { fromDate, toDate } = this.getDateRangeBounds(undefined, fromDateInput, toDateInput);
        const [services, savedCuts] = await Promise.all([
            this.getCompletedServicesForRange(fromDate, toDate),
            this.dailyClosingRepo
                .createQueryBuilder('dailyClosing')
                .where('dailyClosing.closingDate BETWEEN :fromDate AND :toDate', {
                fromDate,
                toDate,
            })
                .orderBy('dailyClosing.closingDate', 'DESC')
                .getMany(),
        ]);
        const servicesByDate = new Map();
        for (const service of services) {
            const date = this.getLabDateFromValue(this.getCompletedMoment(service));
            const current = servicesByDate.get(date) ?? [];
            current.push(service);
            servicesByDate.set(date, current);
        }
        const savedCutsByDate = new Map(savedCuts.map((cut) => [cut.closingDate, cut]));
        const allDates = new Set([
            ...servicesByDate.keys(),
            ...savedCutsByDate.keys(),
        ]);
        const days = [...allDates]
            .map((date) => {
            const savedCut = savedCutsByDate.get(date) ?? null;
            const summary = savedCut
                ? this.buildSummaryFromDailyClosing(savedCut)
                : this.buildSummary(servicesByDate.get(date) ?? []);
            return this.buildDailyOverviewRow(date, summary, savedCut);
        })
            .sort((a, b) => b.date.localeCompare(a.date));
        const totals = days.reduce((acc, day) => {
            acc.servicesCount += day.servicesCount;
            acc.patientsCount += day.patientsCount;
            acc.studiesCount += day.studiesCount;
            acc.subtotalAmount += day.subtotalAmount;
            acc.discountAmount += day.discountAmount;
            acc.totalAmount += day.totalAmount;
            return acc;
        }, {
            servicesCount: 0,
            patientsCount: 0,
            studiesCount: 0,
            subtotalAmount: 0,
            discountAmount: 0,
            totalAmount: 0,
        });
        return {
            fromDate,
            toDate,
            totalDays: days.length,
            savedDaysCount: days.filter((day) => day.isSaved).length,
            days,
            totals,
        };
    }
    async getDailyCutById(id) {
        const closing = await this.dailyClosingRepo.findOne({ where: { id } });
        if (!closing) {
            throw new common_1.NotFoundException('No se encontro el corte solicitado.');
        }
        return this.mapDailyClosing(closing, true);
    }
    async deleteDailyCut(id) {
        this.runtimePolicy.assertHardDeleteAllowed('cortes diarios');
        const closing = await this.dailyClosingRepo.findOne({ where: { id } });
        if (!closing) {
            throw new common_1.NotFoundException('No se encontro el corte solicitado.');
        }
        await this.dailyClosingRepo.delete({ id });
        return {
            id,
            message: `Corte del ${closing.closingDate} eliminado correctamente.`,
        };
    }
    async exportDailyCutCsv(id) {
        const closing = await this.dailyClosingRepo.findOne({ where: { id } });
        if (!closing) {
            throw new common_1.NotFoundException('No se encontro el corte solicitado.');
        }
        const summary = this.mapDailyClosing(closing, true);
        const escapeCsv = (value) => {
            const raw = value == null ? '' : String(value);
            return `"${raw.replace(/"/g, '""')}"`;
        };
        const inferStudiesCountFromSummary = (summaryText) => {
            if (!summaryText?.trim()) {
                return 0;
            }
            return summaryText
                .split('|')
                .map((segment) => segment.trim())
                .filter(Boolean)
                .reduce((total, segment) => {
                if (segment.includes(':')) {
                    const studiesPart = segment.split(':').slice(1).join(':');
                    const studies = studiesPart
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean).length;
                    return total + Math.max(studies, 1);
                }
                return total + 1;
            }, 0);
        };
        const lines = [];
        lines.push('\uFEFFCorte del dia');
        lines.push([
            'Fecha',
            'Servicios',
            'Pacientes',
            'Estudios',
            'Subtotal',
            'Descuento',
            'Total',
        ].join(','));
        lines.push([
            escapeCsv(summary.closingDate),
            summary.servicesCount,
            summary.patientsCount,
            summary.studiesCount,
            summary.subtotalAmount.toFixed(2),
            summary.discountAmount.toFixed(2),
            summary.totalAmount.toFixed(2),
        ].join(','));
        lines.push('');
        lines.push('Detalle de servicios');
        lines.push([
            'Folio',
            'Paciente',
            'Telefono',
            'Medico',
            'Cantidad de estudios',
            'Estudios',
            'Sucursal',
            'Fecha muestra',
            'Conclusion',
            'Creacion',
            'Entrega',
            'Subtotal',
            'Descuento',
            'Total',
        ].join(','));
        for (const item of summary.servicesSnapshot) {
            lines.push([
                escapeCsv(item.folio),
                escapeCsv(item.patientName),
                escapeCsv(item.patientPhone ?? ''),
                escapeCsv(item.doctorName ?? ''),
                item.studiesCount ?? inferStudiesCountFromSummary(item.studySummary),
                escapeCsv(item.studySummary),
                escapeCsv(item.branchName),
                escapeCsv(item.sampleAt ?? ''),
                escapeCsv(item.completedAt ?? ''),
                escapeCsv(item.createdAt ?? ''),
                escapeCsv(item.deliveryAt ?? ''),
                item.subtotalAmount.toFixed(2),
                item.discountAmount.toFixed(2),
                item.totalAmount.toFixed(2),
            ].join(','));
        }
        lines.push('');
        lines.push('Desglose por sucursal');
        lines.push(['Sucursal', 'Servicios', 'Total'].join(','));
        for (const branch of summary.branchBreakdown) {
            lines.push([
                escapeCsv(branch.branchName),
                branch.servicesCount,
                branch.revenueTotal.toFixed(2),
            ].join(','));
        }
        lines.push('');
        lines.push('Estudios mas frecuentes');
        lines.push(['Estudio', 'Veces'].join(','));
        for (const study of summary.topStudies) {
            lines.push([escapeCsv(study.studyName), study.times].join(','));
        }
        return Buffer.from(lines.join('\n'), 'utf-8');
    }
};
exports.HistoryService = HistoryService;
exports.HistoryService = HistoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(service_order_entity_1.ServiceOrder)),
    __param(1, (0, typeorm_1.InjectRepository)(daily_closing_entity_1.DailyClosing)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        database_dialect_service_1.DatabaseDialectService,
        runtime_policy_service_1.RuntimePolicyService])
], HistoryService);
//# sourceMappingURL=history.service.js.map