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
exports.DoctorsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const doctor_entity_1 = require("./entities/doctor.entity");
const database_dialect_service_1 = require("../database/database-dialect.service");
const runtime_policy_service_1 = require("../runtime/runtime-policy.service");
let DoctorsService = class DoctorsService {
    repo;
    databaseDialect;
    runtimePolicy;
    constructor(repo, databaseDialect, runtimePolicy) {
        this.repo = repo;
        this.databaseDialect = databaseDialect;
        this.runtimePolicy = runtimePolicy;
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
    normalizePhoneValue(value) {
        return (value ?? '').replace(/\D+/g, '');
    }
    normalizeEmailValue(value) {
        return (value ?? '').trim().toLowerCase();
    }
    get isSqlite() {
        return this.databaseDialect.type === 'sqlite';
    }
    buildNormalizedSql(field) {
        return this.databaseDialect.buildCompactSearchExpression(field);
    }
    buildDigitsOnlySql(field) {
        return this.databaseDialect.buildDigitsOnlyExpression(field);
    }
    buildLowerTrimSql(field) {
        return this.databaseDialect.buildLowerTrimExpression(field);
    }
    buildFullNameSql(alias) {
        return `concat_ws(' ', ${alias}.firstName, ${alias}.lastName, ${alias}.middleName)`;
    }
    async findByIdOrFail(id) {
        const doctor = await this.repo.findOne({ where: { id } });
        if (!doctor) {
            throw new common_1.NotFoundException('Medico no encontrado.');
        }
        return doctor;
    }
    async findDoctorDuplicateByLicense(licenseNumber, excludeId, activeOnly = false) {
        const normalizedLicense = this.normalizeSearchValue(licenseNumber ?? '');
        if (!normalizedLicense) {
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
                return (this.normalizeSearchValue(candidate.licenseNumber ?? '') ===
                    normalizedLicense);
            }) ?? null);
        }
        const qb = this.repo
            .createQueryBuilder('doctor')
            .where(`${this.buildNormalizedSql('doctor.licenseNumber')} = :license`, {
            license: normalizedLicense,
        });
        if (excludeId) {
            qb.andWhere('doctor.id != :excludeId', { excludeId });
        }
        if (activeOnly) {
            qb.andWhere('doctor.isActive = true');
        }
        return qb.getOne();
    }
    async findDoctorDuplicateByNameAndEmail(doctor, excludeId) {
        const normalizedFullName = this.normalizeSearchValue(`${doctor.firstName} ${doctor.lastName} ${doctor.middleName ?? ''}`);
        const normalizedEmail = this.normalizeEmailValue(doctor.email);
        if (!normalizedFullName || !normalizedEmail) {
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
                    this.normalizeEmailValue(candidate.email) === normalizedEmail);
            }) ?? null);
        }
        const qb = this.repo
            .createQueryBuilder('doctor')
            .where(`${this.buildNormalizedSql(this.buildFullNameSql('doctor'))} = :fullName`, { fullName: normalizedFullName })
            .andWhere(`${this.buildLowerTrimSql('doctor.email')} = :email`, {
            email: normalizedEmail,
        });
        if (excludeId) {
            qb.andWhere('doctor.id != :excludeId', { excludeId });
        }
        return qb.getOne();
    }
    async findDoctorDuplicateByNameAndPhone(doctor, excludeId) {
        const normalizedFullName = this.normalizeSearchValue(`${doctor.firstName} ${doctor.lastName} ${doctor.middleName ?? ''}`);
        const normalizedPhone = this.normalizePhoneValue(doctor.phone);
        if (!normalizedFullName || !normalizedPhone) {
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
                    this.normalizePhoneValue(candidate.phone) === normalizedPhone);
            }) ?? null);
        }
        const qb = this.repo
            .createQueryBuilder('doctor')
            .where(`${this.buildNormalizedSql(this.buildFullNameSql('doctor'))} = :fullName`, { fullName: normalizedFullName })
            .andWhere(`${this.buildDigitsOnlySql('doctor.phone')} = :phone`, {
            phone: normalizedPhone,
        });
        if (excludeId) {
            qb.andWhere('doctor.id != :excludeId', { excludeId });
        }
        return qb.getOne();
    }
    async findDoctorDuplicateByNameAndSpecialty(doctor, excludeId) {
        const normalizedFullName = this.normalizeSearchValue(`${doctor.firstName} ${doctor.lastName} ${doctor.middleName ?? ''}`);
        const normalizedSpecialty = this.normalizeSearchValue(doctor.specialty ?? '');
        if (!normalizedFullName || !normalizedSpecialty) {
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
                    this.normalizeSearchValue(candidate.specialty ?? '') ===
                        normalizedSpecialty);
            }) ?? null);
        }
        const qb = this.repo
            .createQueryBuilder('doctor')
            .where(`${this.buildNormalizedSql(this.buildFullNameSql('doctor'))} = :fullName`, { fullName: normalizedFullName })
            .andWhere(`${this.buildNormalizedSql('doctor.specialty')} = :specialty`, {
            specialty: normalizedSpecialty,
        });
        if (excludeId) {
            qb.andWhere('doctor.id != :excludeId', { excludeId });
        }
        return qb.getOne();
    }
    async findDoctorDuplicateByNameOnly(doctor, excludeId) {
        const normalizedFullName = this.normalizeSearchValue(`${doctor.firstName} ${doctor.lastName} ${doctor.middleName ?? ''}`);
        if (!normalizedFullName) {
            return null;
        }
        if (this.isSqlite) {
            const candidates = await this.repo.find();
            return (candidates.find((candidate) => {
                if (excludeId && candidate.id === excludeId) {
                    return false;
                }
                const candidateNormalizedFullName = this.normalizeSearchValue(`${candidate.firstName} ${candidate.lastName} ${candidate.middleName ?? ''}`);
                return candidateNormalizedFullName === normalizedFullName;
            }) ?? null);
        }
        const qb = this.repo
            .createQueryBuilder('doctor')
            .where(`${this.buildNormalizedSql(this.buildFullNameSql('doctor'))} = :fullName`, { fullName: normalizedFullName });
        if (excludeId) {
            qb.andWhere('doctor.id != :excludeId', { excludeId });
        }
        return qb.getOne();
    }
    async assertNoDuplicateDoctor(doctor, excludeId) {
        const licenseDuplicate = await this.findDoctorDuplicateByLicense(doctor.licenseNumber, excludeId);
        if (licenseDuplicate) {
            throw new common_1.ConflictException('Ya existe un medico con esa cedula profesional.');
        }
        const emailDuplicate = await this.findDoctorDuplicateByNameAndEmail(doctor, excludeId);
        if (emailDuplicate) {
            throw new common_1.ConflictException('Ya existe un medico con el mismo nombre y correo electronico.');
        }
        const phoneDuplicate = await this.findDoctorDuplicateByNameAndPhone(doctor, excludeId);
        if (phoneDuplicate) {
            throw new common_1.ConflictException('Ya existe un medico con el mismo nombre y telefono.');
        }
        if (!this.normalizeSearchValue(doctor.licenseNumber ?? '') &&
            !this.normalizeEmailValue(doctor.email) &&
            !this.normalizePhoneValue(doctor.phone)) {
            const specialtyDuplicate = await this.findDoctorDuplicateByNameAndSpecialty(doctor, excludeId);
            if (specialtyDuplicate) {
                throw new common_1.ConflictException('Ya existe un medico con el mismo nombre y especialidad.');
            }
            if (!this.normalizeSearchValue(doctor.specialty ?? '')) {
                const nameDuplicate = await this.findDoctorDuplicateByNameOnly(doctor, excludeId);
                if (nameDuplicate) {
                    throw new common_1.ConflictException('Ya existe un medico con el mismo nombre completo.');
                }
            }
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
                : rows.filter((doctor) => {
                    const haystack = [
                        doctor.firstName,
                        doctor.lastName,
                        doctor.middleName,
                        `${doctor.firstName} ${doctor.lastName} ${doctor.middleName ?? ''}`,
                        doctor.email,
                        doctor.phone,
                        doctor.licenseNumber,
                        doctor.specialty,
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
            .createQueryBuilder('doctor')
            .select([
            'doctor.id',
            'doctor.firstName',
            'doctor.lastName',
            'doctor.middleName',
            'doctor.email',
            'doctor.phone',
            'doctor.specialty',
            'doctor.licenseNumber',
            'doctor.notes',
            'doctor.isActive',
            'doctor.createdAt',
        ])
            .orderBy('doctor.lastName', 'ASC')
            .addOrderBy('doctor.firstName', 'ASC')
            .skip((page - 1) * limit)
            .take(limit);
        if (normalizedStatus !== 'all') {
            qb.andWhere('doctor.isActive = :isActive', {
                isActive: normalizedStatus === 'active',
            });
        }
        const normalizedSearch = this.normalizeSearchValue(search);
        if (normalizedSearch) {
            const normalizedFields = [
                this.buildNormalizedSql('doctor.firstName'),
                this.buildNormalizedSql('doctor.lastName'),
                this.buildNormalizedSql('doctor.middleName'),
                this.buildNormalizedSql(this.buildFullNameSql('doctor')),
                this.buildNormalizedSql('doctor.email'),
                this.buildNormalizedSql('doctor.phone'),
                this.buildNormalizedSql('doctor.licenseNumber'),
                this.buildNormalizedSql('doctor.specialty'),
            ];
            qb.andWhere(`(${normalizedFields
                .map((field) => `${field} LIKE :search`)
                .join(' OR ')})`, { search: `%${normalizedSearch}%` });
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
        await this.assertNoDuplicateDoctor({
            firstName: dto.firstName,
            lastName: dto.lastName,
            middleName: dto.middleName,
            email: dto.email,
            phone: dto.phone,
            specialty: dto.specialty,
            licenseNumber: dto.licenseNumber,
        });
        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }
    async findOne(id) {
        return this.findByIdOrFail(id);
    }
    async update(id, dto) {
        const doctor = await this.findByIdOrFail(id);
        await this.assertNoDuplicateDoctor({
            firstName: dto.firstName ?? doctor.firstName,
            lastName: dto.lastName ?? doctor.lastName,
            middleName: dto.middleName ?? doctor.middleName,
            email: dto.email ?? doctor.email,
            phone: dto.phone ?? doctor.phone,
            specialty: dto.specialty ?? doctor.specialty,
            licenseNumber: dto.licenseNumber ?? doctor.licenseNumber,
        }, id);
        const merged = this.repo.merge(doctor, dto);
        return this.repo.save(merged);
    }
    async softDelete(id) {
        const doctor = await this.findByIdOrFail(id);
        doctor.isActive = false;
        doctor.deletedAt = new Date();
        await this.repo.save(doctor);
        return { message: 'Medico desactivado correctamente.' };
    }
    async updateStatus(id, dto) {
        const doctor = await this.findByIdOrFail(id);
        if (doctor.isActive === dto.isActive) {
            return doctor;
        }
        doctor.isActive = dto.isActive;
        doctor.deletedAt = dto.isActive ? null : new Date();
        return this.repo.save(doctor);
    }
    async hardDelete(id) {
        this.runtimePolicy.assertHardDeleteAllowed('medicos');
        const doctor = await this.findByIdOrFail(id);
        await this.repo.remove(doctor);
        return { message: 'Medico eliminado definitivamente de la base de datos.' };
    }
    async existsByLicense(licenseNumber) {
        const doctor = await this.findDoctorDuplicateByLicense(licenseNumber, undefined, true);
        return { exists: !!doctor, doctorId: doctor?.id ?? null };
    }
};
exports.DoctorsService = DoctorsService;
exports.DoctorsService = DoctorsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(doctor_entity_1.Doctor)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        database_dialect_service_1.DatabaseDialectService,
        runtime_policy_service_1.RuntimePolicyService])
], DoctorsService);
//# sourceMappingURL=doctors.service.js.map