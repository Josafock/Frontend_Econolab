"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingSyncDependencyError = exports.SYNC_TRACKED_RESOURCE_ENTITY_MAP = exports.SUPPORTED_INBOUND_SYNC_RESOURCES = void 0;
exports.buildPortableSyncPayload = buildPortableSyncPayload;
exports.isSupportedInboundSyncResourceType = isSupportedInboundSyncResourceType;
exports.getSyncTrackedResourceEntity = getSyncTrackedResourceEntity;
exports.sortSyncMutationsByResource = sortSyncMutationsByResource;
exports.requireLocalIdByPublicId = requireLocalIdByPublicId;
const typeorm_1 = require("typeorm");
const doctor_entity_1 = require("../doctors/entities/doctor.entity");
const patient_entity_1 = require("../patients/entities/patient.entity");
const user_entity_1 = require("../users/entities/user.entity");
const service_order_entity_1 = require("../services/entities/service-order.entity");
const study_result_entity_1 = require("../results/entities/study-result.entity");
const study_entity_1 = require("../studies/entities/study.entity");
const study_detail_entity_1 = require("../studies/entities/study-detail.entity");
exports.SUPPORTED_INBOUND_SYNC_RESOURCES = [
    'users',
    'patients',
    'doctors',
    'studies',
    'study_details',
    'service_orders',
    'service_order_items',
    'study_results',
    'study_result_values',
];
exports.SYNC_TRACKED_RESOURCE_ENTITY_MAP = {
    users: user_entity_1.User,
    patients: patient_entity_1.Patient,
    doctors: doctor_entity_1.Doctor,
    studies: study_entity_1.Study,
    study_details: study_detail_entity_1.StudyDetail,
    service_orders: service_order_entity_1.ServiceOrder,
    service_order_items: service_order_entity_1.ServiceOrderItem,
    study_results: study_result_entity_1.StudyResult,
    study_result_values: study_result_entity_1.StudyResultValue,
};
const SYNC_RESOURCE_ORDER = [
    'users',
    'patients',
    'doctors',
    'studies',
    'study_details',
    'service_orders',
    'service_order_items',
    'study_results',
    'study_result_values',
];
function toOptionalNumber(value) {
    if (value == null || value === '') {
        return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}
function toIntegerArray(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((item) => toOptionalNumber(item))
        .filter((item) => item !== undefined)
        .map((item) => Math.trunc(item));
}
async function findPublicIdByLocalId(manager, entity, id) {
    if (!id) {
        return null;
    }
    const found = await manager.getRepository(entity).findOne({
        where: { id },
    });
    return found?.publicId ?? null;
}
async function findLocalIdByPublicId(manager, entity, publicId) {
    if (!publicId) {
        return null;
    }
    const found = await manager.getRepository(entity).findOne({
        where: { publicId },
    });
    return found?.id ?? null;
}
async function resolvePackageStudyPublicIds(manager, packageStudyIds) {
    const ids = toIntegerArray(packageStudyIds);
    if (ids.length === 0) {
        return [];
    }
    const studies = await manager.getRepository(study_entity_1.Study).find({
        where: {
            id: (0, typeorm_1.In)(ids),
        },
    });
    const studyPublicIdsById = new Map(studies
        .filter((study) => Boolean(study.publicId))
        .map((study) => [study.id, study.publicId]));
    return ids
        .map((id) => studyPublicIdsById.get(id))
        .filter((publicId) => Boolean(publicId));
}
async function buildPortableSyncPayload(resourceType, payload, manager) {
    switch (resourceType) {
        case 'studies':
            return {
                ...payload,
                packageStudyPublicIds: await resolvePackageStudyPublicIds(manager, payload.packageStudyIds),
            };
        case 'study_details':
            return {
                ...payload,
                studyPublicId: await findPublicIdByLocalId(manager, study_entity_1.Study, toOptionalNumber(payload.studyId)),
                parentPublicId: await findPublicIdByLocalId(manager, study_detail_entity_1.StudyDetail, toOptionalNumber(payload.parentId)),
            };
        case 'service_orders':
            return {
                ...payload,
                patientPublicId: await findPublicIdByLocalId(manager, patient_entity_1.Patient, toOptionalNumber(payload.patientId)),
                doctorPublicId: await findPublicIdByLocalId(manager, doctor_entity_1.Doctor, toOptionalNumber(payload.doctorId)),
            };
        case 'service_order_items':
            return {
                ...payload,
                serviceOrderPublicId: await findPublicIdByLocalId(manager, service_order_entity_1.ServiceOrder, toOptionalNumber(payload.serviceOrderId)),
                studyPublicId: await findPublicIdByLocalId(manager, study_entity_1.Study, toOptionalNumber(payload.studyId)),
                sourcePackagePublicId: await findPublicIdByLocalId(manager, study_entity_1.Study, toOptionalNumber(payload.sourcePackageId)),
            };
        case 'study_results':
            return {
                ...payload,
                serviceOrderPublicId: await findPublicIdByLocalId(manager, service_order_entity_1.ServiceOrder, toOptionalNumber(payload.serviceOrderId)),
                serviceOrderItemPublicId: await findPublicIdByLocalId(manager, service_order_entity_1.ServiceOrderItem, toOptionalNumber(payload.serviceOrderItemId)),
            };
        case 'study_result_values':
            return {
                ...payload,
                studyResultPublicId: await findPublicIdByLocalId(manager, study_result_entity_1.StudyResult, toOptionalNumber(payload.studyResultId)),
                studyDetailPublicId: await findPublicIdByLocalId(manager, study_detail_entity_1.StudyDetail, toOptionalNumber(payload.studyDetailId)),
            };
        default:
            return payload;
    }
}
function isSupportedInboundSyncResourceType(value) {
    return exports.SUPPORTED_INBOUND_SYNC_RESOURCES.includes(value);
}
function getSyncTrackedResourceEntity(resourceType) {
    if (!isSupportedInboundSyncResourceType(resourceType)) {
        return null;
    }
    return exports.SYNC_TRACKED_RESOURCE_ENTITY_MAP[resourceType];
}
function sortSyncMutationsByResource(items) {
    const orderMap = new Map(SYNC_RESOURCE_ORDER.map((resourceType, index) => [resourceType, index]));
    return [...items].sort((left, right) => {
        const leftOrder = orderMap.get(left.resourceType) ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = orderMap.get(right.resourceType) ?? Number.MAX_SAFE_INTEGER;
        return leftOrder - rightOrder;
    });
}
class MissingSyncDependencyError extends Error {
    resourceType;
    dependencyName;
    dependencyPublicId;
    constructor(resourceType, dependencyName, dependencyPublicId) {
        super(`No se pudo aplicar ${resourceType}: falta ${dependencyName} con publicId ${dependencyPublicId}.`);
        this.resourceType = resourceType;
        this.dependencyName = dependencyName;
        this.dependencyPublicId = dependencyPublicId;
    }
}
exports.MissingSyncDependencyError = MissingSyncDependencyError;
async function requireLocalIdByPublicId(manager, entity, publicId, dependencyName, resourceType) {
    if (!publicId) {
        return null;
    }
    const localId = await findLocalIdByPublicId(manager, entity, publicId);
    if (!localId) {
        throw new MissingSyncDependencyError(resourceType, dependencyName, publicId);
    }
    return localId;
}
//# sourceMappingURL=sync-resource.util.js.map