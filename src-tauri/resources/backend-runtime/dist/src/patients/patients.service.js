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
exports.PatientsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const patient_entity_1 = require("./entities/patient.entity");
const database_dialect_service_1 = require("../database/database-dialect.service");
let PatientsService = class PatientsService {
    repo;
    databaseDialect;
    constructor(repo, databaseDialect) {
        this.repo = repo;
        this.databaseDialect = databaseDialect;
    }
    normalizeStatusFilter(status) {
        if (status === 'inactive' || status === 'all') {
            return status;
        }
        return 'active';
    }
    normalizeSearchValue(value) {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '');
    }
    get isSqlite() {
        return this.databaseDialect.type === 'sqlite';
    }
    buildNormalizedSql(field) {
        return this.databaseDialect.buildCompactSearchExpression(field);
    }
    buildFullNameSql(alias) {
        return `concat_ws(' ', ${alias}.firstName, ${alias}.lastName, ${alias}.middleName)`;
    }
    async findByIdOrFail(id) {
        const patient = await this.repo.findOne({ where: { id } });
        if (!patient) {
            throw new common_1.NotFoundException('Paciente no encontrado.');
        }
        return patient;
    }
    async findPatientDuplicateByDocument(documentType, documentNumber, excludeId, activeOnly = false) {
        const normalizedType = this.normalizeSearchValue(documentType ?? '');
        const normalizedNumber = this.normalizeSearchValue(documentNumber ?? '');
        if (!normalizedType || !normalizedNumber) {
            return null;
        }
        if (this.isSqlite) {
            const candidates = await this.repo.find({
                where: activeOnly ? { isActive: true } : {},
            });
            return (candidates.find((candidate) => {
                if (excludeId && candidate.id === excludeId) {
                    return false;
                }
                return (this.normalizeSearchValue(candidate.documentType ?? '') ===
                    normalizedType &&
                    this.normalizeSearchValue(candidate.documentNumber ?? '') ===
                        normalizedNumber);
            }) ?? null);
        }
        const qb = this.repo
            .createQueryBuilder('patient')
            .where(`${this.buildNormalizedSql('patient.documentType')} = :documentType`, {
            documentType: normalizedType,
        })
            .andWhere(`${this.buildNormalizedSql('patient.documentNumber')} = :documentNumber`, { documentNumber: normalizedNumber });
        if (excludeId) {
            qb.andWhere('patient.id != :excludeId', { excludeId });
        }
        if (activeOnly) {
            qb.andWhere('patient.isActive = true');
        }
        return qb.getOne();
    }
    async findPatientDuplicateByIdentity(patient, excludeId) {
        const normalizedFullName = this.normalizeSearchValue(`${patient.firstName} ${patient.lastName} ${patient.middleName ?? ''}`);
        if (!normalizedFullName || !patient.birthDate) {
            return null;
        }
        if (this.isSqlite) {
            const candidates = await this.repo.find();
            return (candidates.find((candidate) => {
                if (excludeId && candidate.id === excludeId) {
                    return false;
                }
                const candidateNormalizedFullName = this.normalizeSearchValue(`${candidate.firstName} ${candidate.lastName} ${candidate.middleName ?? ''}`);
                return (candidateNormalizedFullName === normalizedFullName &&
                    candidate.birthDate === patient.birthDate);
            }) ?? null);
        }
        const qb = this.repo
            .createQueryBuilder('patient')
            .where(`${this.buildNormalizedSql(this.buildFullNameSql('patient'))} = :fullName`, { fullName: normalizedFullName })
            .andWhere('patient.birthDate = :birthDate', {
            birthDate: patient.birthDate,
        });
        if (excludeId) {
            qb.andWhere('patient.id != :excludeId', { excludeId });
        }
        return qb.getOne();
    }
    async assertNoDuplicatePatient(patient, excludeId) {
        const documentDuplicate = await this.findPatientDuplicateByDocument(patient.documentType, patient.documentNumber, excludeId);
        if (documentDuplicate) {
            throw new common_1.ConflictException('Ya existe un paciente con ese tipo y numero de documento.');
        }
        const identityDuplicate = await this.findPatientDuplicateByIdentity(patient, excludeId);
        if (identityDuplicate) {
            throw new common_1.ConflictException('Ya existe un paciente con el mismo nombre y fecha de nacimiento.');
        }
    }
    async search(search, page = 1, limit = 10, status) {
        const normalizedStatus = this.normalizeStatusFilter(status);
        if (this.isSqlite) {
            const rows = await this.repo.find({
                where: normalizedStatus === 'all'
                    ? {}
                    : { isActive: normalizedStatus === 'active' },
                order: {
                    lastName: 'ASC',
                    firstName: 'ASC',
                },
            });
            const normalizedSearch = this.normalizeSearchValue(search);
            const filtered = !normalizedSearch
                ? rows
                : rows.filter((patient) => {
                    const haystack = [
                        patient.firstName,
                        patient.lastName,
                        patient.middleName,
                        `${patient.firstName} ${patient.lastName} ${patient.middleName ?? ''}`,
                        patient.phone,
                        patient.email,
                        patient.documentNumber,
                        patient.addressLine,
                    ]
                        .map((value) => this.normalizeSearchValue(value ?? ''))
                        .filter(Boolean);
                    return haystack.some((value) => value.includes(normalizedSearch));
                });
            const start = Math.max(0, (page - 1) * limit);
            const data = filtered.slice(start, start + limit);
            return {
                data,
                meta: {
                    page,
                    limit,
                    total: filtered.length,
                },
            };
        }
        const qb = this.repo
            .createQueryBuilder('patient')
            .select([
            'patient.id',
            'patient.firstName',
            'patient.lastName',
            'patient.middleName',
            'patient.gender',
            'patient.birthDate',
            'patient.phone',
            'patient.email',
            'patient.addressLine',
            'patient.addressBetween',
            'patient.addressCity',
            'patient.addressState',
            'patient.addressZip',
            'patient.documentType',
            'patient.documentNumber',
            'patient.isActive',
            'patient.createdAt',
        ])
            .orderBy('patient.lastName', 'ASC')
            .addOrderBy('patient.firstName', 'ASC')
            .skip((page - 1) * limit)
            .take(limit);
        if (normalizedStatus !== 'all') {
            qb.andWhere('patient.isActive = :isActive', {
                isActive: normalizedStatus === 'active',
            });
        }
        const normalizedSearch = this.normalizeSearchValue(search);
        if (normalizedSearch) {
            const normalizedFields = [
                this.buildNormalizedSql('patient.firstName'),
                this.buildNormalizedSql('patient.lastName'),
                this.buildNormalizedSql('patient.middleName'),
                this.buildNormalizedSql(this.buildFullNameSql('patient')),
                this.buildNormalizedSql('patient.phone'),
                this.buildNormalizedSql('patient.email'),
                this.buildNormalizedSql('patient.documentNumber'),
                this.buildNormalizedSql('patient.addressLine'),
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
    async create(dto) {
        await this.assertNoDuplicatePatient({
            firstName: dto.firstName,
            lastName: dto.lastName,
            middleName: dto.middleName,
            birthDate: dto.birthDate,
            documentType: dto.documentType,
            documentNumber: dto.documentNumber,
        });
        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }
    async findOne(id) {
        return this.findByIdOrFail(id);
    }
    async update(id, dto) {
        const patient = await this.findByIdOrFail(id);
        await this.assertNoDuplicatePatient({
            firstName: dto.firstName ?? patient.firstName,
            lastName: dto.lastName ?? patient.lastName,
            middleName: dto.middleName ?? patient.middleName,
            birthDate: dto.birthDate ?? patient.birthDate,
            documentType: dto.documentType ?? patient.documentType,
            documentNumber: dto.documentNumber ?? patient.documentNumber,
        }, id);
        const merged = this.repo.merge(patient, dto);
        return this.repo.save(merged);
    }
    async softDelete(id) {
        const patient = await this.findByIdOrFail(id);
        patient.isActive = false;
        patient.deletedAt = new Date();
        await this.repo.save(patient);
        return { message: 'Paciente desactivado correctamente.' };
    }
    async updateStatus(id, dto) {
        const patient = await this.findByIdOrFail(id);
        if (patient.isActive === dto.isActive) {
            return patient;
        }
        patient.isActive = dto.isActive;
        patient.deletedAt = dto.isActive ? null : new Date();
        return this.repo.save(patient);
    }
    async existsByDocument(documentType, documentNumber) {
        const patient = await this.findPatientDuplicateByDocument(documentType, documentNumber, undefined, true);
        return { exists: !!patient, patientId: patient?.id ?? null };
    }
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(patient_entity_1.Patient)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        database_dialect_service_1.DatabaseDialectService])
], PatientsService);
//# sourceMappingURL=patients.service.js.map