"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
async function main() {
    process.env.DATABASE_TYPE ??= 'sqlite';
    process.env.APP_RUNTIME_MODE ??= 'desktop-offline';
    process.env.DATABASE_SYNCHRONIZE ??= 'false';
    process.env.DATABASE_LOGGING ??= 'false';
    process.env.DATABASE_SQLITE_PATH ??= (0, node_path_1.resolve)(process.cwd(), 'tmp', 'phase11-sync-inbound.sqlite');
    (0, node_fs_1.mkdirSync)((0, node_path_1.dirname)(process.env.DATABASE_SQLITE_PATH), { recursive: true });
    (0, node_fs_1.rmSync)(process.env.DATABASE_SQLITE_PATH, { force: true });
    const { default: appDataSource } = await Promise.resolve().then(() => require('../src/database/typeorm.datasource'));
    const { Doctor } = await Promise.resolve().then(() => require('../src/doctors/entities/doctor.entity'));
    const { Patient } = await Promise.resolve().then(() => require('../src/patients/entities/patient.entity'));
    const { ServiceOrder, ServiceOrderItem, ServiceItemPriceType, ServiceStatus, } = await Promise.resolve().then(() => require('../src/services/entities/service-order.entity'));
    const { SyncOutboxEvent, SyncOutboxOperation } = await Promise.resolve().then(() => require('../src/sync/entities/sync-outbox-event.entity'));
    const { Study } = await Promise.resolve().then(() => require('../src/studies/entities/study.entity'));
    const { StudyDetail } = await Promise.resolve().then(() => require('../src/studies/entities/study-detail.entity'));
    const { StudyResult, StudyResultValue } = await Promise.resolve().then(() => require('../src/results/entities/study-result.entity'));
    const { SyncInboundService } = await Promise.resolve().then(() => require('../src/sync/sync-inbound.service'));
    await appDataSource.initialize();
    try {
        await appDataSource.runMigrations();
        const inbound = new SyncInboundService(appDataSource);
        const patientRepo = appDataSource.getRepository(Patient);
        const doctorRepo = appDataSource.getRepository(Doctor);
        const studyRepo = appDataSource.getRepository(Study);
        const detailRepo = appDataSource.getRepository(StudyDetail);
        const serviceRepo = appDataSource.getRepository(ServiceOrder);
        const itemRepo = appDataSource.getRepository(ServiceOrderItem);
        const resultRepo = appDataSource.getRepository(StudyResult);
        const valueRepo = appDataSource.getRepository(StudyResultValue);
        const outboxRepo = appDataSource.getRepository(SyncOutboxEvent);
        const patientPublicId = (0, node_crypto_1.randomUUID)();
        const doctorPublicId = (0, node_crypto_1.randomUUID)();
        const studyPublicId = (0, node_crypto_1.randomUUID)();
        const detailPublicId = (0, node_crypto_1.randomUUID)();
        const servicePublicId = (0, node_crypto_1.randomUUID)();
        const itemPublicId = (0, node_crypto_1.randomUUID)();
        const resultPublicId = (0, node_crypto_1.randomUUID)();
        const valuePublicId = (0, node_crypto_1.randomUUID)();
        const result = await inbound.applyBatch([
            {
                resourceType: 'study_result_values',
                operation: SyncOutboxOperation.UPSERT,
                payload: {
                    publicId: valuePublicId,
                    syncVersion: 1,
                    syncOrigin: 'server',
                    studyResultPublicId: resultPublicId,
                    studyDetailPublicId: detailPublicId,
                    label: 'GLUCOSA',
                    unit: 'mg/dL',
                    referenceValue: '70-99',
                    value: '92',
                    sortOrder: 1,
                    visible: true,
                },
            },
            {
                resourceType: 'study_results',
                operation: SyncOutboxOperation.UPSERT,
                payload: {
                    publicId: resultPublicId,
                    syncVersion: 1,
                    syncOrigin: 'server',
                    serviceOrderPublicId: servicePublicId,
                    serviceOrderItemPublicId: itemPublicId,
                    sampleAt: '2026-03-29T10:00:00.000Z',
                    reportedAt: '2026-03-29T11:00:00.000Z',
                    method: 'Automatizado',
                    observations: 'Sin observaciones',
                    isDraft: false,
                    isActive: true,
                },
            },
            {
                resourceType: 'service_order_items',
                operation: SyncOutboxOperation.UPSERT,
                payload: {
                    publicId: itemPublicId,
                    syncVersion: 1,
                    syncOrigin: 'server',
                    serviceOrderPublicId: servicePublicId,
                    studyPublicId,
                    sourcePackagePublicId: null,
                    studyNameSnapshot: 'Quimica sanguinea',
                    priceType: ServiceItemPriceType.NORMAL,
                    unitPrice: 120,
                    quantity: 1,
                    discountPercent: 0,
                    subtotalAmount: 120,
                },
            },
            {
                resourceType: 'service_orders',
                operation: SyncOutboxOperation.UPSERT,
                payload: {
                    publicId: servicePublicId,
                    syncVersion: 1,
                    syncOrigin: 'server',
                    patientPublicId,
                    doctorPublicId,
                    folio: 'ECO2603290001',
                    branchName: 'Matriz',
                    sampleAt: '2026-03-29T10:00:00.000Z',
                    deliveryAt: '2026-03-29T12:00:00.000Z',
                    completedAt: '2026-03-29T11:30:00.000Z',
                    status: ServiceStatus.COMPLETED,
                    subtotalAmount: 120,
                    courtesyPercent: 0,
                    discountAmount: 0,
                    totalAmount: 120,
                    notes: 'Sync smoke',
                    isActive: true,
                },
            },
            {
                resourceType: 'study_details',
                operation: SyncOutboxOperation.UPSERT,
                payload: {
                    publicId: detailPublicId,
                    syncVersion: 1,
                    syncOrigin: 'server',
                    studyPublicId,
                    parentPublicId: null,
                    dataType: 'parameter',
                    name: 'GLUCOSA',
                    sortOrder: 1,
                    unit: 'mg/dL',
                    referenceValue: '70-99',
                    isActive: true,
                },
            },
            {
                resourceType: 'studies',
                operation: SyncOutboxOperation.UPSERT,
                payload: {
                    publicId: studyPublicId,
                    syncVersion: 1,
                    syncOrigin: 'server',
                    name: 'Quimica sanguinea',
                    code: 'QS001',
                    durationMinutes: 60,
                    type: 'study',
                    normalPrice: 120,
                    difPrice: 100,
                    specialPrice: 110,
                    hospitalPrice: 130,
                    otherPrice: 120,
                    defaultDiscountPercent: 0,
                    packageStudyPublicIds: [],
                    status: 'active',
                    isActive: true,
                },
            },
            {
                resourceType: 'doctors',
                operation: SyncOutboxOperation.UPSERT,
                payload: {
                    publicId: doctorPublicId,
                    syncVersion: 1,
                    syncOrigin: 'server',
                    firstName: 'Ana',
                    lastName: 'Medina',
                    specialty: 'Medicina general',
                    isActive: true,
                },
            },
            {
                resourceType: 'patients',
                operation: SyncOutboxOperation.UPSERT,
                payload: {
                    publicId: patientPublicId,
                    syncVersion: 1,
                    syncOrigin: 'server',
                    firstName: 'Carlos',
                    lastName: 'Ruiz',
                    gender: 'male',
                    birthDate: '1992-04-10',
                    isActive: true,
                },
            },
        ]);
        const [patient, doctor, study, detail, service, item, studyResult, value, outboxCount,] = await Promise.all([
            patientRepo.findOne({ where: {} }),
            doctorRepo.findOne({ where: {} }),
            studyRepo.findOne({ where: { publicId: studyPublicId } }),
            detailRepo.findOne({ where: { publicId: detailPublicId } }),
            serviceRepo.findOne({ where: { publicId: servicePublicId } }),
            itemRepo.findOne({ where: { publicId: itemPublicId } }),
            resultRepo.findOne({ where: { publicId: resultPublicId } }),
            valueRepo.findOne({ where: { publicId: valuePublicId } }),
            outboxRepo.count(),
        ]);
        console.log(JSON.stringify({
            ok: true,
            summary: {
                appliedCount: result.appliedCount,
                deferredCount: result.deferredCount,
                failedCount: result.failedCount,
            },
            statuses: result.results.map((item) => ({
                resourceType: item.resourceType,
                status: item.status,
            })),
            resolved: {
                patientPublicId: patient?.publicId ?? null,
                doctorPublicId: doctor?.publicId ?? null,
                studyPublicId: study?.publicId ?? null,
                detailStudyId: detail?.studyId ?? null,
                detailPublicId: detail?.publicId ?? null,
                servicePatientId: service?.patientId ?? null,
                serviceDoctorId: service?.doctorId ?? null,
                itemServiceOrderId: item?.serviceOrderId ?? null,
                itemStudyId: item?.studyId ?? null,
                resultServiceOrderId: studyResult?.serviceOrderId ?? null,
                resultItemId: studyResult?.serviceOrderItemId ?? null,
                valueResultId: value?.studyResultId ?? null,
                valueStudyDetailId: value?.studyDetailId ?? null,
                outboxCount,
            },
        }, null, 2));
    }
    finally {
        await appDataSource.destroy();
    }
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=sync-inbound-smoke.js.map