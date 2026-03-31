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
exports.StudiesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const lab_date_util_1 = require("../common/utils/lab-date.util");
const study_entity_1 = require("./entities/study.entity");
const study_detail_entity_1 = require("./entities/study-detail.entity");
const database_dialect_service_1 = require("../database/database-dialect.service");
const runtime_policy_service_1 = require("../runtime/runtime-policy.service");
const LAB_TIME_ZONE = 'America/Mexico_City';
const AUTO_SEQUENCE_PAD = 4;
const AUTO_STUDY_CODE_PREFIX = {
    [study_entity_1.StudyType.STUDY]: 'EST',
    [study_entity_1.StudyType.PACKAGE]: 'PAQ',
    [study_entity_1.StudyType.OTHER]: 'OTR',
};
let StudiesService = class StudiesService {
    studyRepo;
    detailRepo;
    databaseDialect;
    runtimePolicy;
    constructor(studyRepo, detailRepo, databaseDialect, runtimePolicy) {
        this.studyRepo = studyRepo;
        this.detailRepo = detailRepo;
        this.databaseDialect = databaseDialect;
        this.runtimePolicy = runtimePolicy;
    }
    normalizeSearchValue(value) {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '');
    }
    buildNormalizedSql(field) {
        return this.databaseDialect.buildCompactSearchExpression(field);
        return `regexp_replace(lower(translate(coalesce(${field}, ''), 'áéíóúäëïöüàèìòùÁÉÍÓÚÄËÏÖÜÀÈÌÒÙñÑ', 'aeiouaeiouaeiouAEIOUAEIOUAEIOUnN')), '[^a-z0-9]+', '', 'g')`;
    }
    getLabDateToken(date = new Date()) {
        return (0, lab_date_util_1.getLabDateToken)(LAB_TIME_ZONE, date);
    }
    buildAutoStudyCode(type, sequence, date = new Date()) {
        return `${AUTO_STUDY_CODE_PREFIX[type]}${this.getLabDateToken(date)}${String(sequence).padStart(AUTO_SEQUENCE_PAD, '0')}`;
    }
    extractAutoSequenceValue(value, type, dateToken) {
        if (!value)
            return 0;
        const match = new RegExp(`^${AUTO_STUDY_CODE_PREFIX[type]}${dateToken}(\\d{${AUTO_SEQUENCE_PAD}})$`, 'i').exec(value.trim());
        return match ? Number(match[1]) : 0;
    }
    isUniqueConstraintError(error) {
        return (error instanceof typeorm_2.QueryFailedError &&
            error
                .driverError?.code === '23505');
    }
    async getNextAutoStudyCode(type, date = new Date()) {
        const dateToken = this.getLabDateToken(date);
        const prefix = `${AUTO_STUDY_CODE_PREFIX[type]}${dateToken}%`;
        const latest = await this.studyRepo
            .createQueryBuilder('study')
            .where('study.code LIKE :prefix', { prefix })
            .andWhere(`${this.databaseDialect.getDateTokenExpression(LAB_TIME_ZONE, 'study.createdAt')} = :dateToken`, { dateToken })
            .orderBy('study.code', 'DESC')
            .getOne();
        const nextSequence = this.extractAutoSequenceValue(latest?.code, type, dateToken) + 1;
        return this.buildAutoStudyCode(type, nextSequence, date);
    }
    normalizeStudyCode(code) {
        const normalized = code?.trim().toUpperCase();
        return normalized ? normalized : null;
    }
    async findDuplicateStudyByName(name, type, excludeId) {
        const normalizedName = this.normalizeSearchValue(name);
        if (!normalizedName) {
            return null;
        }
        const qb = this.studyRepo
            .createQueryBuilder('study')
            .where('study.type = :type', { type })
            .andWhere(`${this.buildNormalizedSql('study.name')} = :name`, {
            name: normalizedName,
        });
        if (excludeId) {
            qb.andWhere('study.id != :excludeId', { excludeId });
        }
        return qb.getOne();
    }
    async assertNoDuplicateStudyName(name, type, excludeId) {
        const duplicate = await this.findDuplicateStudyByName(name, type, excludeId);
        if (duplicate) {
            throw new common_1.ConflictException('Ya existe otro registro con el mismo nombre dentro de este tipo.');
        }
    }
    async findActiveStudyOrFail(id) {
        const study = await this.studyRepo.findOne({
            where: { id, isActive: true },
        });
        if (!study) {
            throw new common_1.NotFoundException('Estudio no encontrado.');
        }
        return study;
    }
    async findDetailOrFail(detailId, activeOnly = false) {
        const detail = await this.detailRepo.findOne({
            where: activeOnly ? { id: detailId, isActive: true } : { id: detailId },
        });
        if (!detail) {
            throw new common_1.NotFoundException('Detalle de estudio no encontrado.');
        }
        return detail;
    }
    ensureStudyAllowsDirectDetails(study, message) {
        if (study.type === study_entity_1.StudyType.PACKAGE) {
            throw new common_1.BadRequestException(message);
        }
    }
    async assertParentDetailExists(studyId, parentId) {
        if (parentId === undefined || parentId === null) {
            return;
        }
        const parent = await this.detailRepo.findOne({
            where: { id: parentId, studyId, isActive: true },
        });
        if (!parent) {
            throw new common_1.NotFoundException('El detalle padre no existe en este estudio.');
        }
    }
    async getSuggestedCode(type = study_entity_1.StudyType.STUDY) {
        return { code: await this.getNextAutoStudyCode(type) };
    }
    async validatePackageStudyIds(packageStudyIds, currentStudyId) {
        const normalizedIds = [...new Set((packageStudyIds ?? []).filter(Boolean))];
        if (currentStudyId && normalizedIds.includes(currentStudyId)) {
            throw new common_1.BadRequestException('Un paquete no puede incluirse a si mismo.');
        }
        if (normalizedIds.length === 0) {
            return [];
        }
        const studies = await this.studyRepo.findByIds(normalizedIds);
        if (studies.length !== normalizedIds.length) {
            throw new common_1.NotFoundException('Uno o mas estudios del paquete no existen.');
        }
        const invalidStudy = studies.find((study) => !study.isActive ||
            study.status !== study_entity_1.StudyStatus.ACTIVE ||
            study.type !== study_entity_1.StudyType.STUDY);
        if (invalidStudy) {
            throw new common_1.BadRequestException('Los paquetes solo pueden incluir estudios individuales activos.');
        }
        return normalizedIds;
    }
    async search(search, type, status, page = 1, limit = 10) {
        const qb = this.studyRepo
            .createQueryBuilder('study')
            .where('study.isActive = :isActive', { isActive: true })
            .orderBy('study.name', 'ASC')
            .skip((page - 1) * limit)
            .take(limit);
        if (type) {
            qb.andWhere('study.type = :type', { type });
        }
        if (status) {
            qb.andWhere('study.status = :status', { status });
        }
        const normalizedSearch = this.normalizeSearchValue(search);
        if (normalizedSearch) {
            const normalizedFields = [
                this.buildNormalizedSql('study.name'),
                this.buildNormalizedSql('study.code'),
                this.buildNormalizedSql('study.description'),
                this.buildNormalizedSql('study.method'),
                this.buildNormalizedSql('study.indicator'),
            ];
            qb.andWhere(`(${normalizedFields
                .map((field) => `${field} LIKE :search`)
                .join(' OR ')})`, {
                search: `%${normalizedSearch}%`,
            });
        }
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: {
                page,
                limit,
                total,
            },
        };
    }
    async existsByCode(code) {
        const normalizedCode = this.normalizeStudyCode(code);
        if (!normalizedCode) {
            return { exists: false, studyId: null };
        }
        const study = await this.studyRepo.findOne({
            where: { code: normalizedCode, isActive: true },
            select: ['id'],
        });
        return { exists: !!study, studyId: study?.id ?? null };
    }
    async create(dto) {
        const packageStudyIds = dto.type === study_entity_1.StudyType.PACKAGE
            ? await this.validatePackageStudyIds(dto.packageStudyIds)
            : [];
        await this.assertNoDuplicateStudyName(dto.name, dto.type);
        const manualCode = this.normalizeStudyCode(dto.code);
        const useAutoCode = dto.autoGenerateCode ?? false;
        if (!useAutoCode && !manualCode) {
            throw new common_1.BadRequestException('La clave es obligatoria o activa la generacion automatica.');
        }
        const saveStudy = async (code) => {
            const entity = this.studyRepo.create({
                ...dto,
                code,
                packageStudyIds,
                normalPrice: dto.normalPrice,
                difPrice: dto.difPrice,
                specialPrice: dto.specialPrice,
                hospitalPrice: dto.hospitalPrice,
                otherPrice: dto.otherPrice,
                defaultDiscountPercent: dto.defaultDiscountPercent,
            });
            return this.studyRepo.save(entity);
        };
        if (!useAutoCode && manualCode) {
            const existing = await this.studyRepo.findOne({
                where: { code: manualCode },
            });
            if (existing) {
                throw new common_1.ConflictException('Ya existe un estudio con esta clave.');
            }
            try {
                return await saveStudy(manualCode);
            }
            catch (error) {
                if (this.isUniqueConstraintError(error)) {
                    throw new common_1.ConflictException('Ya existe un estudio con esta clave.');
                }
                throw error;
            }
        }
        for (let attempt = 0; attempt < 5; attempt += 1) {
            const nextCode = await this.getNextAutoStudyCode(dto.type);
            try {
                return await saveStudy(nextCode);
            }
            catch (error) {
                if (!this.isUniqueConstraintError(error)) {
                    throw error;
                }
            }
        }
        throw new common_1.ConflictException('No se pudo generar una clave automatica. Intenta de nuevo.');
    }
    async findOne(id) {
        return this.findActiveStudyOrFail(id);
    }
    async update(id, dto) {
        const study = await this.findOne(id);
        const nextType = dto.type ?? study.type;
        const nextName = dto.name ?? study.name;
        const manualCode = this.normalizeStudyCode(dto.code);
        const useAutoCode = dto.autoGenerateCode ?? false;
        await this.assertNoDuplicateStudyName(nextName, nextType, id);
        if (!useAutoCode && manualCode && manualCode !== study.code) {
            const existing = await this.studyRepo.findOne({
                where: { code: manualCode },
            });
            if (existing && existing.id !== id) {
                throw new common_1.ConflictException('Ya existe otro estudio con esta clave.');
            }
        }
        const packageStudyIds = nextType === study_entity_1.StudyType.PACKAGE
            ? await this.validatePackageStudyIds(dto.packageStudyIds ?? study.packageStudyIds, id)
            : [];
        const saveStudy = async (code) => {
            const merged = this.studyRepo.merge(study, {
                ...dto,
                code,
                packageStudyIds,
                normalPrice: dto.normalPrice ?? study.normalPrice,
                difPrice: dto.difPrice ?? study.difPrice,
                specialPrice: dto.specialPrice ?? study.specialPrice,
                hospitalPrice: dto.hospitalPrice ?? study.hospitalPrice,
                otherPrice: dto.otherPrice ?? study.otherPrice,
                defaultDiscountPercent: dto.defaultDiscountPercent ?? study.defaultDiscountPercent,
            });
            return this.studyRepo.save(merged);
        };
        if (!useAutoCode) {
            try {
                return await saveStudy(manualCode ?? study.code);
            }
            catch (error) {
                if (this.isUniqueConstraintError(error)) {
                    throw new common_1.ConflictException('Ya existe otro estudio con esta clave.');
                }
                throw error;
            }
        }
        for (let attempt = 0; attempt < 5; attempt += 1) {
            const nextCode = await this.getNextAutoStudyCode(nextType);
            try {
                return await saveStudy(nextCode);
            }
            catch (error) {
                if (!this.isUniqueConstraintError(error)) {
                    throw error;
                }
            }
        }
        throw new common_1.ConflictException('No se pudo generar una clave automatica. Intenta de nuevo.');
    }
    async softDelete(id) {
        const study = await this.findOne(id);
        study.isActive = false;
        study.deletedAt = new Date();
        await this.studyRepo.save(study);
        return { message: 'Estudio desactivado correctamente.' };
    }
    async hardDelete(id) {
        this.runtimePolicy.assertHardDeleteAllowed('estudios');
        const study = await this.findOne(id);
        await this.studyRepo.remove(study);
        return {
            message: 'Estudio eliminado definitivamente de la base de datos.',
        };
    }
    async listDetails(studyId) {
        const study = await this.findOne(studyId);
        if (study.type === study_entity_1.StudyType.PACKAGE) {
            return [];
        }
        const details = await this.detailRepo.find({
            where: { studyId },
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
        return details;
    }
    async createDetail(studyId, dto) {
        const study = await this.findOne(studyId);
        this.ensureStudyAllowsDirectDetails(study, 'Los paquetes no definen parametros directos. Agrega estudios al paquete.');
        await this.assertParentDetailExists(studyId, dto.parentId);
        const entity = this.detailRepo.create({
            ...dto,
            studyId,
        });
        return this.detailRepo.save(entity);
    }
    async updateDetail(detailId, dto) {
        const detail = await this.findDetailOrFail(detailId);
        const study = await this.findOne(detail.studyId);
        this.ensureStudyAllowsDirectDetails(study, 'Los paquetes no administran parametros directos.');
        await this.assertParentDetailExists(detail.studyId, dto.parentId);
        const merged = this.detailRepo.merge(detail, dto);
        return this.detailRepo.save(merged);
    }
    async updateDetailStatus(detailId, dto) {
        const detail = await this.findDetailOrFail(detailId);
        if (detail.isActive === dto.isActive) {
            return detail;
        }
        detail.isActive = dto.isActive;
        detail.deletedAt = dto.isActive ? null : new Date();
        return this.detailRepo.save(detail);
    }
    async softDeleteDetail(detailId) {
        const detail = await this.findDetailOrFail(detailId, true);
        detail.isActive = false;
        detail.deletedAt = new Date();
        await this.detailRepo.save(detail);
        return { message: 'Detalle de estudio desactivado correctamente.' };
    }
    async hardDeleteDetail(detailId) {
        this.runtimePolicy.assertHardDeleteAllowed('detalles de estudio');
        const detail = await this.findDetailOrFail(detailId, true);
        await this.detailRepo.remove(detail);
        return { message: 'Detalle de estudio eliminado definitivamente.' };
    }
};
exports.StudiesService = StudiesService;
exports.StudiesService = StudiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(study_entity_1.Study)),
    __param(1, (0, typeorm_1.InjectRepository)(study_detail_entity_1.StudyDetail)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        database_dialect_service_1.DatabaseDialectService,
        runtime_policy_service_1.RuntimePolicyService])
], StudiesService);
//# sourceMappingURL=studies.service.js.map