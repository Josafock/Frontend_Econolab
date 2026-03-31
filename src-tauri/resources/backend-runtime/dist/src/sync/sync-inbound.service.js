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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncInboundService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const doctor_entity_1 = require("../doctors/entities/doctor.entity");
const patient_entity_1 = require("../patients/entities/patient.entity");
const user_entity_1 = require("../users/entities/user.entity");
const service_order_entity_1 = require("../services/entities/service-order.entity");
const study_result_entity_1 = require("../results/entities/study-result.entity");
const sync_outbox_event_entity_1 = require("./entities/sync-outbox-event.entity");
const sync_entity_util_1 = require("./sync-entity.util");
const sync_resource_util_1 = require("./sync-resource.util");
const study_entity_1 = require("../studies/entities/study.entity");
const study_detail_entity_1 = require("../studies/entities/study-detail.entity");
const roles_enum_1 = require("../common/enums/roles.enum");
function toOptionalString(value) {
    return typeof value === 'string' && value.trim() ? value : null;
}
function toOptionalDate(value) {
    if (typeof value !== 'string' || !value.trim()) {
        return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function toOptionalNumber(value) {
    if (value == null || value === '') {
        return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}
function toBoolean(value, defaultValue = false) {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'number') {
        return value !== 0;
    }
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['1', 'true', 'yes', 'on'].includes(normalized)) {
            return true;
        }
        if (['0', 'false', 'no', 'off'].includes(normalized)) {
            return false;
        }
    }
    return defaultValue;
}
function toStringArray(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.filter((item) => typeof item === 'string' && item.trim().length > 0);
}
function createResult(base, status, message, localId) {
    return {
        ...base,
        status,
        message,
        localId,
    };
}
let SyncInboundService = class SyncInboundService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async applyBatch(mutations) {
        const sorted = (0, sync_resource_util_1.sortSyncMutationsByResource)(mutations.map((mutation, index) => ({
            ...mutation,
            index,
        })));
        const results = new Map();
        let pending = sorted;
        while (pending.length > 0) {
            let appliedInPass = false;
            const nextPending = [];
            for (const mutation of pending) {
                const result = await this.applySingleMutation(mutation);
                if (result.status === 'deferred_missing_dependency') {
                    nextPending.push(mutation);
                    continue;
                }
                results.set(mutation.index, result);
                appliedInPass = true;
            }
            if (nextPending.length === 0) {
                break;
            }
            if (!appliedInPass) {
                for (const mutation of nextPending) {
                    results.set(mutation.index, createResult({
                        index: mutation.index,
                        resourceType: mutation.resourceType,
                        operation: mutation.operation,
                        publicId: toOptionalString(mutation.payload.publicId),
                    }, 'deferred_missing_dependency', 'La mutacion sigue esperando dependencias no disponibles localmente.', null));
                }
                break;
            }
            pending = nextPending;
        }
        const orderedResults = mutations.map((_, index) => results.get(index));
        return {
            total: orderedResults.length,
            appliedCount: orderedResults.filter((result) => result.status === 'applied')
                .length,
            skippedCount: orderedResults.filter((result) => ['skipped_stale', 'skipped_duplicate'].includes(result.status)).length,
            deferredCount: orderedResults.filter((result) => result.status === 'deferred_missing_dependency').length,
            failedCount: orderedResults.filter((result) => ['failed', 'unsupported_resource'].includes(result.status)).length,
            results: orderedResults,
        };
    }
    async applySingleMutation(mutation) {
        const publicId = toOptionalString(mutation.payload.publicId);
        if (!(0, sync_resource_util_1.isSupportedInboundSyncResourceType)(mutation.resourceType)) {
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'unsupported_resource', `El recurso ${mutation.resourceType} aun no esta soportado para sync inbound.`, null);
        }
        try {
            return await this.dataSource.transaction(async (manager) => this.withInboundContext(manager, () => this.applySupportedMutation(manager, mutation)));
        }
        catch (error) {
            if (error instanceof sync_resource_util_1.MissingSyncDependencyError) {
                return createResult({
                    index: mutation.index,
                    resourceType: mutation.resourceType,
                    operation: mutation.operation,
                    publicId,
                }, 'deferred_missing_dependency', error.message, null);
            }
            const message = error instanceof Error ? error.message : 'No se pudo aplicar la mutacion.';
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'failed', message, null);
        }
    }
    async withInboundContext(manager, work) {
        const queryRunner = manager.queryRunner;
        if (!queryRunner) {
            return work();
        }
        const currentData = typeof queryRunner.data === 'object' && queryRunner.data !== null
            ? queryRunner.data
            : {};
        const previousFlag = currentData[sync_entity_util_1.SYNC_OUTBOX_SKIP_FLAG];
        currentData[sync_entity_util_1.SYNC_OUTBOX_SKIP_FLAG] = true;
        queryRunner.data = currentData;
        try {
            return await work();
        }
        finally {
            if (previousFlag === undefined) {
                delete currentData[sync_entity_util_1.SYNC_OUTBOX_SKIP_FLAG];
            }
            else {
                currentData[sync_entity_util_1.SYNC_OUTBOX_SKIP_FLAG] = previousFlag;
            }
            queryRunner.data = currentData;
        }
    }
    async applySupportedMutation(manager, mutation) {
        switch (mutation.resourceType) {
            case 'users':
                return this.applyUser(manager, mutation);
            case 'patients':
                return this.applyPatient(manager, mutation);
            case 'doctors':
                return this.applyDoctor(manager, mutation);
            case 'studies':
                return this.applyStudy(manager, mutation);
            case 'study_details':
                return this.applyStudyDetail(manager, mutation);
            case 'service_orders':
                return this.applyServiceOrder(manager, mutation);
            case 'service_order_items':
                return this.applyServiceOrderItem(manager, mutation);
            case 'study_results':
                return this.applyStudyResult(manager, mutation);
            case 'study_result_values':
                return this.applyStudyResultValue(manager, mutation);
            default:
                throw new Error(`Recurso ${mutation.resourceType} no soportado.`);
        }
    }
    shouldSkipMutation(currentVersion, incomingVersion) {
        return currentVersion > incomingVersion;
    }
    async confirmEntitySyncState(repo, entity, incomingVersion) {
        const currentLastSyncedVersion = Math.max(0, Number(entity.lastSyncedVersion ?? 0));
        if (currentLastSyncedVersion >= incomingVersion &&
            entity.lastSyncedAt instanceof Date) {
            return;
        }
        const syncedAt = new Date();
        await repo.update({ id: entity.id }, {
            lastSyncedVersion: Math.max(currentLastSyncedVersion, incomingVersion),
            lastSyncedAt: syncedAt,
        });
        entity.lastSyncedVersion = Math.max(currentLastSyncedVersion, incomingVersion);
        entity.lastSyncedAt = syncedAt;
    }
    isDuplicateMutation(currentVersion, incomingVersion, currentDeletedAt, incomingDeletedAt) {
        return (currentVersion === incomingVersion &&
            (currentDeletedAt?.toISOString() ?? null) ===
                (incomingDeletedAt?.toISOString() ?? null));
    }
    async applyUser(manager, mutation) {
        const repo = manager.getRepository(user_entity_1.User);
        const publicId = toOptionalString(mutation.payload.publicId);
        if (!publicId) {
            throw new Error('La mutacion de usuario requiere publicId.');
        }
        const incomingVersion = Math.max(1, Math.trunc(toOptionalNumber(mutation.payload.syncVersion) ?? 1));
        const incomingDeletedAt = mutation.operation === sync_outbox_event_entity_1.SyncOutboxOperation.DELETE
            ? toOptionalDate(mutation.payload.deletedAt) ?? new Date()
            : toOptionalDate(mutation.payload.deletedAt);
        const existing = await repo.findOne({ where: { publicId } });
        if (mutation.operation === sync_outbox_event_entity_1.SyncOutboxOperation.DELETE) {
            if (!existing) {
                return createResult({
                    index: mutation.index,
                    resourceType: mutation.resourceType,
                    operation: mutation.operation,
                    publicId,
                }, 'skipped_duplicate', 'El usuario ya no existe localmente.', null);
            }
            if (this.shouldSkipMutation(existing.syncVersion, incomingVersion)) {
                return createResult({
                    index: mutation.index,
                    resourceType: mutation.resourceType,
                    operation: mutation.operation,
                    publicId,
                }, 'skipped_stale', 'La mutacion ya fue superada por una version local mas reciente.', Number(existing.id));
            }
            await repo.remove(existing);
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'applied', 'Usuario eliminado correctamente.', Number(existing.id));
        }
        if (existing && this.shouldSkipMutation(existing.syncVersion, incomingVersion)) {
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'skipped_stale', 'La mutacion ya fue superada por una version local mas reciente.', Number(existing.id));
        }
        if (existing &&
            this.isDuplicateMutation(existing.syncVersion, incomingVersion, existing.deletedAt, incomingDeletedAt)) {
            await this.confirmEntitySyncState(repo, existing, incomingVersion);
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'skipped_duplicate', 'La mutacion ya estaba aplicada localmente.', Number(existing.id));
        }
        const entity = (0, sync_entity_util_1.markSyncEntityForRemoteApply)(existing ?? repo.create());
        repo.merge(entity, {
            publicId,
            syncVersion: incomingVersion,
            lastSyncedVersion: incomingVersion,
            syncOrigin: toOptionalString(mutation.payload.syncOrigin) ??
                entity.syncOrigin ??
                'server',
            lastSyncedAt: new Date(),
            deletedAt: incomingDeletedAt,
            nombre: toOptionalString(mutation.payload.nombre) ?? '',
            email: toOptionalString(mutation.payload.email)?.toLowerCase() ?? '',
            password: toOptionalString(mutation.payload.password) ?? '',
            token: toOptionalString(mutation.payload.token),
            confirmed: toBoolean(mutation.payload.confirmed, false),
            rol: toOptionalString(mutation.payload.rol) ??
                roles_enum_1.Role.Unassigned,
            profileImageData: toOptionalString(mutation.payload.profileImageData) ?? null,
            profileImageMimeType: toOptionalString(mutation.payload.profileImageMimeType) ?? null,
            googleAvatarUrl: toOptionalString(mutation.payload.googleAvatarUrl) ?? null,
            resetTokenExpiresAt: toOptionalDate(mutation.payload.resetTokenExpiresAt),
            resetRequestCount: Math.max(0, Math.trunc(toOptionalNumber(mutation.payload.resetRequestCount) ?? 0)) ?? 0,
            resetRequestWindowStart: toOptionalDate(mutation.payload.resetRequestWindowStart),
            failedLoginAttempts: Math.max(0, Math.trunc(toOptionalNumber(mutation.payload.failedLoginAttempts) ?? 0)),
            lockUntil: toOptionalDate(mutation.payload.lockUntil),
        });
        const saved = await repo.save(entity);
        return createResult({
            index: mutation.index,
            resourceType: mutation.resourceType,
            operation: mutation.operation,
            publicId,
        }, 'applied', 'Usuario sincronizado correctamente.', Number(saved.id));
    }
    async applyPatient(manager, mutation) {
        const repo = manager.getRepository(patient_entity_1.Patient);
        const publicId = toOptionalString(mutation.payload.publicId);
        if (!publicId) {
            throw new Error('La mutacion de paciente requiere publicId.');
        }
        const incomingVersion = Math.max(1, Math.trunc(toOptionalNumber(mutation.payload.syncVersion) ?? 1));
        const incomingDeletedAt = mutation.operation === sync_outbox_event_entity_1.SyncOutboxOperation.DELETE
            ? toOptionalDate(mutation.payload.deletedAt) ?? new Date()
            : toOptionalDate(mutation.payload.deletedAt);
        const existing = await repo.findOne({ where: { publicId } });
        if (existing && this.shouldSkipMutation(existing.syncVersion, incomingVersion)) {
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'skipped_stale', 'La mutacion ya fue superada por una version local mas reciente.', existing.id);
        }
        if (existing &&
            this.isDuplicateMutation(existing.syncVersion, incomingVersion, existing.deletedAt, incomingDeletedAt)) {
            await this.confirmEntitySyncState(repo, existing, incomingVersion);
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'skipped_duplicate', 'La mutacion ya estaba aplicada localmente.', existing.id);
        }
        const entity = (0, sync_entity_util_1.markSyncEntityForRemoteApply)(existing ?? repo.create());
        repo.merge(entity, {
            publicId,
            syncVersion: incomingVersion,
            lastSyncedVersion: incomingVersion,
            syncOrigin: toOptionalString(mutation.payload.syncOrigin) ??
                entity.syncOrigin ??
                'server',
            lastSyncedAt: new Date(),
            deletedAt: incomingDeletedAt,
            firstName: toOptionalString(mutation.payload.firstName) ?? '',
            lastName: toOptionalString(mutation.payload.lastName) ?? '',
            middleName: toOptionalString(mutation.payload.middleName) ?? undefined,
            gender: toOptionalString(mutation.payload.gender) ??
                patient_entity_1.PatientGender.OTHER,
            birthDate: toOptionalString(mutation.payload.birthDate) ?? '1900-01-01',
            phone: toOptionalString(mutation.payload.phone) ?? undefined,
            email: toOptionalString(mutation.payload.email) ?? undefined,
            addressLine: toOptionalString(mutation.payload.addressLine) ?? undefined,
            addressBetween: toOptionalString(mutation.payload.addressBetween) ?? undefined,
            addressCity: toOptionalString(mutation.payload.addressCity) ?? undefined,
            addressState: toOptionalString(mutation.payload.addressState) ?? undefined,
            addressZip: toOptionalString(mutation.payload.addressZip) ?? undefined,
            documentType: toOptionalString(mutation.payload.documentType) ?? undefined,
            documentNumber: toOptionalString(mutation.payload.documentNumber) ?? undefined,
            isActive: mutation.operation === sync_outbox_event_entity_1.SyncOutboxOperation.DELETE
                ? false
                : toBoolean(mutation.payload.isActive, incomingDeletedAt == null),
        });
        const saved = await repo.save(entity);
        return createResult({
            index: mutation.index,
            resourceType: mutation.resourceType,
            operation: mutation.operation,
            publicId,
        }, 'applied', 'Paciente sincronizado correctamente.', saved.id);
    }
    async applyDoctor(manager, mutation) {
        const repo = manager.getRepository(doctor_entity_1.Doctor);
        const publicId = toOptionalString(mutation.payload.publicId);
        if (!publicId) {
            throw new Error('La mutacion de medico requiere publicId.');
        }
        const incomingVersion = Math.max(1, Math.trunc(toOptionalNumber(mutation.payload.syncVersion) ?? 1));
        const incomingDeletedAt = mutation.operation === sync_outbox_event_entity_1.SyncOutboxOperation.DELETE
            ? toOptionalDate(mutation.payload.deletedAt) ?? new Date()
            : toOptionalDate(mutation.payload.deletedAt);
        const existing = await repo.findOne({ where: { publicId } });
        if (existing && this.shouldSkipMutation(existing.syncVersion, incomingVersion)) {
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'skipped_stale', 'La mutacion ya fue superada por una version local mas reciente.', existing.id);
        }
        if (existing &&
            this.isDuplicateMutation(existing.syncVersion, incomingVersion, existing.deletedAt, incomingDeletedAt)) {
            await this.confirmEntitySyncState(repo, existing, incomingVersion);
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'skipped_duplicate', 'La mutacion ya estaba aplicada localmente.', existing.id);
        }
        const entity = (0, sync_entity_util_1.markSyncEntityForRemoteApply)(existing ?? repo.create());
        repo.merge(entity, {
            publicId,
            syncVersion: incomingVersion,
            lastSyncedVersion: incomingVersion,
            syncOrigin: toOptionalString(mutation.payload.syncOrigin) ??
                entity.syncOrigin ??
                'server',
            lastSyncedAt: new Date(),
            deletedAt: incomingDeletedAt,
            firstName: toOptionalString(mutation.payload.firstName) ?? '',
            lastName: toOptionalString(mutation.payload.lastName) ?? '',
            middleName: toOptionalString(mutation.payload.middleName) ?? undefined,
            email: toOptionalString(mutation.payload.email) ?? undefined,
            phone: toOptionalString(mutation.payload.phone) ?? undefined,
            specialty: toOptionalString(mutation.payload.specialty) ?? undefined,
            licenseNumber: toOptionalString(mutation.payload.licenseNumber) ?? undefined,
            notes: toOptionalString(mutation.payload.notes) ?? undefined,
            isActive: mutation.operation === sync_outbox_event_entity_1.SyncOutboxOperation.DELETE
                ? false
                : toBoolean(mutation.payload.isActive, incomingDeletedAt == null),
        });
        const saved = await repo.save(entity);
        return createResult({
            index: mutation.index,
            resourceType: mutation.resourceType,
            operation: mutation.operation,
            publicId,
        }, 'applied', 'Medico sincronizado correctamente.', saved.id);
    }
    async applyStudy(manager, mutation) {
        const repo = manager.getRepository(study_entity_1.Study);
        const publicId = toOptionalString(mutation.payload.publicId);
        if (!publicId) {
            throw new Error('La mutacion de estudio requiere publicId.');
        }
        const incomingVersion = Math.max(1, Math.trunc(toOptionalNumber(mutation.payload.syncVersion) ?? 1));
        const incomingDeletedAt = mutation.operation === sync_outbox_event_entity_1.SyncOutboxOperation.DELETE
            ? toOptionalDate(mutation.payload.deletedAt) ?? new Date()
            : toOptionalDate(mutation.payload.deletedAt);
        const packageStudyPublicIds = toStringArray(mutation.payload.packageStudyPublicIds);
        const existing = await repo.findOne({ where: { publicId } });
        if (existing && this.shouldSkipMutation(existing.syncVersion, incomingVersion)) {
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'skipped_stale', 'La mutacion ya fue superada por una version local mas reciente.', existing.id);
        }
        if (existing &&
            this.isDuplicateMutation(existing.syncVersion, incomingVersion, existing.deletedAt, incomingDeletedAt)) {
            await this.confirmEntitySyncState(repo, existing, incomingVersion);
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'skipped_duplicate', 'La mutacion ya estaba aplicada localmente.', existing.id);
        }
        const packageStudyIds = [];
        for (const packageStudyPublicId of packageStudyPublicIds) {
            const localId = await (0, sync_resource_util_1.requireLocalIdByPublicId)(manager, study_entity_1.Study, packageStudyPublicId, 'study', mutation.resourceType);
            if (localId) {
                packageStudyIds.push(localId);
            }
        }
        const entity = (0, sync_entity_util_1.markSyncEntityForRemoteApply)(existing ?? repo.create());
        repo.merge(entity, {
            publicId,
            syncVersion: incomingVersion,
            lastSyncedVersion: incomingVersion,
            syncOrigin: toOptionalString(mutation.payload.syncOrigin) ??
                entity.syncOrigin ??
                'server',
            lastSyncedAt: new Date(),
            deletedAt: incomingDeletedAt,
            name: toOptionalString(mutation.payload.name) ?? '',
            code: toOptionalString(mutation.payload.code) ?? '',
            description: toOptionalString(mutation.payload.description) ?? undefined,
            durationMinutes: Math.trunc(toOptionalNumber(mutation.payload.durationMinutes) ?? 60),
            type: toOptionalString(mutation.payload.type) ??
                study_entity_1.StudyType.STUDY,
            normalPrice: toOptionalNumber(mutation.payload.normalPrice) ?? 0,
            difPrice: toOptionalNumber(mutation.payload.difPrice) ?? 0,
            specialPrice: toOptionalNumber(mutation.payload.specialPrice) ?? 0,
            hospitalPrice: toOptionalNumber(mutation.payload.hospitalPrice) ?? 0,
            otherPrice: toOptionalNumber(mutation.payload.otherPrice) ?? 0,
            defaultDiscountPercent: toOptionalNumber(mutation.payload.defaultDiscountPercent) ?? 0,
            method: toOptionalString(mutation.payload.method) ?? undefined,
            indicator: toOptionalString(mutation.payload.indicator) ?? undefined,
            packageStudyIds,
            status: toOptionalString(mutation.payload.status) ??
                study_entity_1.StudyStatus.ACTIVE,
            isActive: mutation.operation === sync_outbox_event_entity_1.SyncOutboxOperation.DELETE
                ? false
                : toBoolean(mutation.payload.isActive, incomingDeletedAt == null),
        });
        const saved = await repo.save(entity);
        return createResult({
            index: mutation.index,
            resourceType: mutation.resourceType,
            operation: mutation.operation,
            publicId,
        }, 'applied', 'Estudio sincronizado correctamente.', saved.id);
    }
    async applyStudyDetail(manager, mutation) {
        const repo = manager.getRepository(study_detail_entity_1.StudyDetail);
        const publicId = toOptionalString(mutation.payload.publicId);
        if (!publicId) {
            throw new Error('La mutacion de detalle de estudio requiere publicId.');
        }
        const incomingVersion = Math.max(1, Math.trunc(toOptionalNumber(mutation.payload.syncVersion) ?? 1));
        const incomingDeletedAt = mutation.operation === sync_outbox_event_entity_1.SyncOutboxOperation.DELETE
            ? toOptionalDate(mutation.payload.deletedAt) ?? new Date()
            : toOptionalDate(mutation.payload.deletedAt);
        const existing = await repo.findOne({ where: { publicId } });
        if (existing && this.shouldSkipMutation(existing.syncVersion, incomingVersion)) {
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'skipped_stale', 'La mutacion ya fue superada por una version local mas reciente.', existing.id);
        }
        if (existing &&
            this.isDuplicateMutation(existing.syncVersion, incomingVersion, existing.deletedAt, incomingDeletedAt)) {
            await this.confirmEntitySyncState(repo, existing, incomingVersion);
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'skipped_duplicate', 'La mutacion ya estaba aplicada localmente.', existing.id);
        }
        const studyId = await (0, sync_resource_util_1.requireLocalIdByPublicId)(manager, study_entity_1.Study, toOptionalString(mutation.payload.studyPublicId), 'study', mutation.resourceType);
        const parentId = await (0, sync_resource_util_1.requireLocalIdByPublicId)(manager, study_detail_entity_1.StudyDetail, toOptionalString(mutation.payload.parentPublicId), 'parent detail', mutation.resourceType);
        const entity = (0, sync_entity_util_1.markSyncEntityForRemoteApply)(existing ?? repo.create());
        repo.merge(entity, {
            publicId,
            syncVersion: incomingVersion,
            lastSyncedVersion: incomingVersion,
            syncOrigin: toOptionalString(mutation.payload.syncOrigin) ??
                entity.syncOrigin ??
                'server',
            lastSyncedAt: new Date(),
            deletedAt: incomingDeletedAt,
            studyId: studyId ?? entity.studyId,
            parentId,
            dataType: toOptionalString(mutation.payload.dataType) ??
                study_detail_entity_1.StudyDetailType.PARAMETER,
            name: toOptionalString(mutation.payload.name) ?? '',
            sortOrder: Math.trunc(toOptionalNumber(mutation.payload.sortOrder) ?? 1),
            unit: toOptionalString(mutation.payload.unit) ?? undefined,
            referenceValue: toOptionalString(mutation.payload.referenceValue) ?? undefined,
            isActive: mutation.operation === sync_outbox_event_entity_1.SyncOutboxOperation.DELETE
                ? false
                : toBoolean(mutation.payload.isActive, incomingDeletedAt == null),
        });
        const saved = await repo.save(entity);
        return createResult({
            index: mutation.index,
            resourceType: mutation.resourceType,
            operation: mutation.operation,
            publicId,
        }, 'applied', 'Detalle de estudio sincronizado correctamente.', saved.id);
    }
    async applyServiceOrder(manager, mutation) {
        const repo = manager.getRepository(service_order_entity_1.ServiceOrder);
        const publicId = toOptionalString(mutation.payload.publicId);
        if (!publicId) {
            throw new Error('La mutacion de servicio requiere publicId.');
        }
        const incomingVersion = Math.max(1, Math.trunc(toOptionalNumber(mutation.payload.syncVersion) ?? 1));
        const incomingDeletedAt = mutation.operation === sync_outbox_event_entity_1.SyncOutboxOperation.DELETE
            ? toOptionalDate(mutation.payload.deletedAt) ?? new Date()
            : toOptionalDate(mutation.payload.deletedAt);
        const existing = await repo.findOne({ where: { publicId } });
        if (existing && this.shouldSkipMutation(existing.syncVersion, incomingVersion)) {
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'skipped_stale', 'La mutacion ya fue superada por una version local mas reciente.', existing.id);
        }
        if (existing &&
            this.isDuplicateMutation(existing.syncVersion, incomingVersion, existing.deletedAt, incomingDeletedAt)) {
            await this.confirmEntitySyncState(repo, existing, incomingVersion);
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'skipped_duplicate', 'La mutacion ya estaba aplicada localmente.', existing.id);
        }
        const patientId = await (0, sync_resource_util_1.requireLocalIdByPublicId)(manager, patient_entity_1.Patient, toOptionalString(mutation.payload.patientPublicId), 'patient', mutation.resourceType);
        const doctorId = await (0, sync_resource_util_1.requireLocalIdByPublicId)(manager, doctor_entity_1.Doctor, toOptionalString(mutation.payload.doctorPublicId), 'doctor', mutation.resourceType);
        const entity = (0, sync_entity_util_1.markSyncEntityForRemoteApply)(existing ?? repo.create());
        repo.merge(entity, {
            publicId,
            syncVersion: incomingVersion,
            lastSyncedVersion: incomingVersion,
            syncOrigin: toOptionalString(mutation.payload.syncOrigin) ??
                entity.syncOrigin ??
                'server',
            lastSyncedAt: new Date(),
            deletedAt: incomingDeletedAt,
            folio: toOptionalString(mutation.payload.folio) ?? '',
            patientId: patientId ?? entity.patientId,
            doctorId: doctorId ?? undefined,
            branchName: toOptionalString(mutation.payload.branchName) ?? undefined,
            sampleAt: toOptionalDate(mutation.payload.sampleAt) ?? undefined,
            deliveryAt: toOptionalDate(mutation.payload.deliveryAt) ?? undefined,
            completedAt: toOptionalDate(mutation.payload.completedAt) ?? undefined,
            status: toOptionalString(mutation.payload.status) ??
                service_order_entity_1.ServiceStatus.PENDING,
            subtotalAmount: toOptionalNumber(mutation.payload.subtotalAmount) ?? 0,
            courtesyPercent: toOptionalNumber(mutation.payload.courtesyPercent) ?? 0,
            discountAmount: toOptionalNumber(mutation.payload.discountAmount) ?? 0,
            totalAmount: toOptionalNumber(mutation.payload.totalAmount) ?? 0,
            notes: toOptionalString(mutation.payload.notes) ?? undefined,
            isActive: mutation.operation === sync_outbox_event_entity_1.SyncOutboxOperation.DELETE
                ? false
                : toBoolean(mutation.payload.isActive, incomingDeletedAt == null),
        });
        const saved = await repo.save(entity);
        return createResult({
            index: mutation.index,
            resourceType: mutation.resourceType,
            operation: mutation.operation,
            publicId,
        }, 'applied', 'Servicio sincronizado correctamente.', saved.id);
    }
    async applyServiceOrderItem(manager, mutation) {
        const repo = manager.getRepository(service_order_entity_1.ServiceOrderItem);
        const publicId = toOptionalString(mutation.payload.publicId);
        if (!publicId) {
            throw new Error('La mutacion de item de servicio requiere publicId.');
        }
        const incomingVersion = Math.max(1, Math.trunc(toOptionalNumber(mutation.payload.syncVersion) ?? 1));
        const existing = await repo.findOne({ where: { publicId } });
        if (mutation.operation === sync_outbox_event_entity_1.SyncOutboxOperation.DELETE) {
            if (!existing) {
                return createResult({
                    index: mutation.index,
                    resourceType: mutation.resourceType,
                    operation: mutation.operation,
                    publicId,
                }, 'skipped_duplicate', 'El item ya no existe localmente.', null);
            }
            if (this.shouldSkipMutation(existing.syncVersion, incomingVersion)) {
                return createResult({
                    index: mutation.index,
                    resourceType: mutation.resourceType,
                    operation: mutation.operation,
                    publicId,
                }, 'skipped_stale', 'La mutacion ya fue superada por una version local mas reciente.', existing.id);
            }
            await repo.remove(existing);
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'applied', 'Item de servicio eliminado correctamente.', existing.id);
        }
        if (existing && existing.syncVersion === incomingVersion) {
            await this.confirmEntitySyncState(repo, existing, incomingVersion);
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'skipped_duplicate', 'La mutacion ya estaba aplicada localmente.', existing.id);
        }
        if (existing && this.shouldSkipMutation(existing.syncVersion, incomingVersion)) {
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'skipped_stale', 'La mutacion ya fue superada por una version local mas reciente.', existing.id);
        }
        const serviceOrderId = await (0, sync_resource_util_1.requireLocalIdByPublicId)(manager, service_order_entity_1.ServiceOrder, toOptionalString(mutation.payload.serviceOrderPublicId), 'service order', mutation.resourceType);
        const studyId = await (0, sync_resource_util_1.requireLocalIdByPublicId)(manager, study_entity_1.Study, toOptionalString(mutation.payload.studyPublicId), 'study', mutation.resourceType);
        const sourcePackageId = await (0, sync_resource_util_1.requireLocalIdByPublicId)(manager, study_entity_1.Study, toOptionalString(mutation.payload.sourcePackagePublicId), 'source package', mutation.resourceType);
        const entity = (0, sync_entity_util_1.markSyncEntityForRemoteApply)(existing ?? repo.create());
        repo.merge(entity, {
            publicId,
            syncVersion: incomingVersion,
            lastSyncedVersion: incomingVersion,
            syncOrigin: toOptionalString(mutation.payload.syncOrigin) ??
                entity.syncOrigin ??
                'server',
            lastSyncedAt: new Date(),
            deletedAt: null,
            serviceOrderId: serviceOrderId ?? entity.serviceOrderId,
            studyId: studyId ?? entity.studyId,
            studyNameSnapshot: toOptionalString(mutation.payload.studyNameSnapshot) ?? '',
            sourcePackageId: sourcePackageId ?? undefined,
            sourcePackageNameSnapshot: toOptionalString(mutation.payload.sourcePackageNameSnapshot) ?? undefined,
            priceType: toOptionalString(mutation.payload.priceType) ??
                service_order_entity_1.ServiceItemPriceType.NORMAL,
            unitPrice: toOptionalNumber(mutation.payload.unitPrice) ?? 0,
            quantity: Math.trunc(toOptionalNumber(mutation.payload.quantity) ?? 1),
            discountPercent: toOptionalNumber(mutation.payload.discountPercent) ?? 0,
            subtotalAmount: toOptionalNumber(mutation.payload.subtotalAmount) ?? 0,
        });
        const saved = await repo.save(entity);
        return createResult({
            index: mutation.index,
            resourceType: mutation.resourceType,
            operation: mutation.operation,
            publicId,
        }, 'applied', 'Item de servicio sincronizado correctamente.', saved.id);
    }
    async applyStudyResult(manager, mutation) {
        const repo = manager.getRepository(study_result_entity_1.StudyResult);
        const publicId = toOptionalString(mutation.payload.publicId);
        if (!publicId) {
            throw new Error('La mutacion de resultado requiere publicId.');
        }
        const incomingVersion = Math.max(1, Math.trunc(toOptionalNumber(mutation.payload.syncVersion) ?? 1));
        const incomingDeletedAt = mutation.operation === sync_outbox_event_entity_1.SyncOutboxOperation.DELETE
            ? toOptionalDate(mutation.payload.deletedAt) ?? new Date()
            : toOptionalDate(mutation.payload.deletedAt);
        const existing = await repo.findOne({ where: { publicId } });
        if (existing && this.shouldSkipMutation(existing.syncVersion, incomingVersion)) {
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'skipped_stale', 'La mutacion ya fue superada por una version local mas reciente.', existing.id);
        }
        if (existing &&
            this.isDuplicateMutation(existing.syncVersion, incomingVersion, existing.deletedAt, incomingDeletedAt)) {
            await this.confirmEntitySyncState(repo, existing, incomingVersion);
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'skipped_duplicate', 'La mutacion ya estaba aplicada localmente.', existing.id);
        }
        const serviceOrderId = await (0, sync_resource_util_1.requireLocalIdByPublicId)(manager, service_order_entity_1.ServiceOrder, toOptionalString(mutation.payload.serviceOrderPublicId), 'service order', mutation.resourceType);
        const serviceOrderItemId = await (0, sync_resource_util_1.requireLocalIdByPublicId)(manager, service_order_entity_1.ServiceOrderItem, toOptionalString(mutation.payload.serviceOrderItemPublicId), 'service order item', mutation.resourceType);
        const entity = (0, sync_entity_util_1.markSyncEntityForRemoteApply)(existing ?? repo.create());
        repo.merge(entity, {
            publicId,
            syncVersion: incomingVersion,
            lastSyncedVersion: incomingVersion,
            syncOrigin: toOptionalString(mutation.payload.syncOrigin) ??
                entity.syncOrigin ??
                'server',
            lastSyncedAt: new Date(),
            deletedAt: incomingDeletedAt,
            serviceOrderId: serviceOrderId ?? entity.serviceOrderId,
            serviceOrderItemId: serviceOrderItemId ?? entity.serviceOrderItemId,
            sampleAt: toOptionalDate(mutation.payload.sampleAt) ?? undefined,
            reportedAt: toOptionalDate(mutation.payload.reportedAt) ?? undefined,
            method: toOptionalString(mutation.payload.method) ?? undefined,
            observations: toOptionalString(mutation.payload.observations) ?? undefined,
            isDraft: toBoolean(mutation.payload.isDraft, true),
            isActive: mutation.operation === sync_outbox_event_entity_1.SyncOutboxOperation.DELETE
                ? false
                : toBoolean(mutation.payload.isActive, incomingDeletedAt == null),
        });
        const saved = await repo.save(entity);
        return createResult({
            index: mutation.index,
            resourceType: mutation.resourceType,
            operation: mutation.operation,
            publicId,
        }, 'applied', 'Resultado sincronizado correctamente.', saved.id);
    }
    async applyStudyResultValue(manager, mutation) {
        const repo = manager.getRepository(study_result_entity_1.StudyResultValue);
        const publicId = toOptionalString(mutation.payload.publicId);
        if (!publicId) {
            throw new Error('La mutacion de valor de resultado requiere publicId.');
        }
        const incomingVersion = Math.max(1, Math.trunc(toOptionalNumber(mutation.payload.syncVersion) ?? 1));
        const existing = await repo.findOne({ where: { publicId } });
        if (mutation.operation === sync_outbox_event_entity_1.SyncOutboxOperation.DELETE) {
            if (!existing) {
                return createResult({
                    index: mutation.index,
                    resourceType: mutation.resourceType,
                    operation: mutation.operation,
                    publicId,
                }, 'skipped_duplicate', 'El valor ya no existe localmente.', null);
            }
            if (this.shouldSkipMutation(existing.syncVersion, incomingVersion)) {
                return createResult({
                    index: mutation.index,
                    resourceType: mutation.resourceType,
                    operation: mutation.operation,
                    publicId,
                }, 'skipped_stale', 'La mutacion ya fue superada por una version local mas reciente.', existing.id);
            }
            await repo.remove(existing);
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'applied', 'Valor de resultado eliminado correctamente.', existing.id);
        }
        if (existing && existing.syncVersion === incomingVersion) {
            await this.confirmEntitySyncState(repo, existing, incomingVersion);
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'skipped_duplicate', 'La mutacion ya estaba aplicada localmente.', existing.id);
        }
        if (existing && this.shouldSkipMutation(existing.syncVersion, incomingVersion)) {
            return createResult({
                index: mutation.index,
                resourceType: mutation.resourceType,
                operation: mutation.operation,
                publicId,
            }, 'skipped_stale', 'La mutacion ya fue superada por una version local mas reciente.', existing.id);
        }
        const studyResultId = await (0, sync_resource_util_1.requireLocalIdByPublicId)(manager, study_result_entity_1.StudyResult, toOptionalString(mutation.payload.studyResultPublicId), 'study result', mutation.resourceType);
        const studyDetailId = await (0, sync_resource_util_1.requireLocalIdByPublicId)(manager, study_detail_entity_1.StudyDetail, toOptionalString(mutation.payload.studyDetailPublicId), 'study detail', mutation.resourceType);
        const entity = (0, sync_entity_util_1.markSyncEntityForRemoteApply)(existing ?? repo.create());
        repo.merge(entity, {
            publicId,
            syncVersion: incomingVersion,
            lastSyncedVersion: incomingVersion,
            syncOrigin: toOptionalString(mutation.payload.syncOrigin) ??
                entity.syncOrigin ??
                'server',
            lastSyncedAt: new Date(),
            deletedAt: null,
            studyResultId: studyResultId ?? entity.studyResultId,
            studyDetailId: studyDetailId ?? undefined,
            label: toOptionalString(mutation.payload.label) ?? '',
            unit: toOptionalString(mutation.payload.unit) ?? undefined,
            referenceValue: toOptionalString(mutation.payload.referenceValue) ?? undefined,
            value: toOptionalString(mutation.payload.value) ?? undefined,
            sortOrder: Math.trunc(toOptionalNumber(mutation.payload.sortOrder) ?? 1),
            visible: toBoolean(mutation.payload.visible, true),
        });
        const saved = await repo.save(entity);
        return createResult({
            index: mutation.index,
            resourceType: mutation.resourceType,
            operation: mutation.operation,
            publicId,
        }, 'applied', 'Valor de resultado sincronizado correctamente.', saved.id);
    }
};
exports.SyncInboundService = SyncInboundService;
exports.SyncInboundService = SyncInboundService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], SyncInboundService);
//# sourceMappingURL=sync-inbound.service.js.map