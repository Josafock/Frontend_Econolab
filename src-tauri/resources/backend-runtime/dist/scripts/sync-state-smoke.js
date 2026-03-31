"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const config_1 = require("@nestjs/config");
async function main() {
    process.env.DATABASE_TYPE ??= 'sqlite';
    process.env.APP_RUNTIME_MODE ??= 'desktop-offline';
    process.env.DATABASE_SYNCHRONIZE ??= 'false';
    process.env.DATABASE_LOGGING ??= 'false';
    process.env.DATABASE_SQLITE_PATH ??= (0, node_path_1.resolve)(process.cwd(), 'tmp', 'phase11-sync-state.sqlite');
    (0, node_fs_1.mkdirSync)((0, node_path_1.dirname)(process.env.DATABASE_SQLITE_PATH), { recursive: true });
    (0, node_fs_1.rmSync)(process.env.DATABASE_SQLITE_PATH, { force: true });
    const { default: appDataSource } = await Promise.resolve().then(() => require('../src/database/typeorm.datasource'));
    const { Patient, PatientGender } = await Promise.resolve().then(() => require('../src/patients/entities/patient.entity'));
    const { getSyncRuntimeConfig, syncConfig } = await Promise.resolve().then(() => require('../src/config/sync.config'));
    const { SyncOutboxEvent } = await Promise.resolve().then(() => require('../src/sync/entities/sync-outbox-event.entity'));
    const { SyncOutboxService } = await Promise.resolve().then(() => require('../src/sync/sync-outbox.service'));
    await appDataSource.initialize();
    try {
        await appDataSource.runMigrations();
        const patientRepo = appDataSource.getRepository(Patient);
        const outboxRepo = appDataSource.getRepository(SyncOutboxEvent);
        const configService = new config_1.ConfigService({
            sync: getSyncRuntimeConfig(process.env),
        });
        const outboxService = new SyncOutboxService(outboxRepo, configService, appDataSource);
        const patient = patientRepo.create({
            firstName: 'State',
            lastName: 'Smoke',
            gender: PatientGender.OTHER,
            birthDate: '1995-05-05',
            isActive: true,
            documentType: 'sync-state',
            documentNumber: `phase11-${Date.now()}`,
        });
        const created = await patientRepo.save(patient);
        const summaryAfterCreate = await outboxService.getSummary();
        const firstClaim = await outboxService.claimPendingBatch(10);
        if (!firstClaim.leaseToken) {
            throw new Error('No se encontro leaseToken para el primer ACK.');
        }
        await outboxService.markAsSynced(firstClaim.leaseToken);
        const afterFirstAck = await patientRepo.findOneByOrFail({ id: created.id });
        const firstAckState = {
            syncVersion: afterFirstAck.syncVersion,
            lastSyncedVersion: afterFirstAck.lastSyncedVersion,
            lastSyncedAt: afterFirstAck.lastSyncedAt,
        };
        const summaryAfterFirstAck = await outboxService.getSummary();
        afterFirstAck.phone = '5550002222';
        await patientRepo.save(afterFirstAck);
        const afterLocalUpdate = await patientRepo.findOneByOrFail({ id: created.id });
        const summaryAfterLocalUpdate = await outboxService.getSummary();
        const secondClaim = await outboxService.claimPendingBatch(10);
        if (!secondClaim.leaseToken) {
            throw new Error('No se encontro leaseToken para el segundo ACK.');
        }
        await outboxService.markAsSynced(secondClaim.leaseToken);
        const afterSecondAck = await patientRepo.findOneByOrFail({ id: created.id });
        const summaryAfterSecondAck = await outboxService.getSummary();
        if (created.lastSyncedVersion !== 0) {
            throw new Error('El registro nuevo debio comenzar con lastSyncedVersion = 0.');
        }
        if (summaryAfterCreate.resources.patients.pendingSync !== 1 ||
            firstAckState.lastSyncedVersion !== firstAckState.syncVersion ||
            !firstAckState.lastSyncedAt ||
            summaryAfterFirstAck.resources.patients.pendingSync !== 0) {
            throw new Error('El primer ACK no dejo el recurso en estado sincronizado.');
        }
        if (afterLocalUpdate.syncVersion <= afterLocalUpdate.lastSyncedVersion ||
            summaryAfterLocalUpdate.resources.patients.pendingSync !== 1) {
            throw new Error('La actualizacion local debio dejar al recurso con cambios pendientes.');
        }
        if (afterSecondAck.lastSyncedVersion !== afterSecondAck.syncVersion ||
            !afterSecondAck.lastSyncedAt ||
            summaryAfterSecondAck.resources.patients.pendingSync !== 0) {
            throw new Error('El segundo ACK no confirmo la version sincronizada.');
        }
        console.log(JSON.stringify({
            ok: true,
            patient: {
                publicId: afterSecondAck.publicId,
                syncVersion: afterSecondAck.syncVersion,
                lastSyncedVersion: afterSecondAck.lastSyncedVersion,
            },
            summaries: {
                afterCreate: summaryAfterCreate.resources.patients,
                afterFirstAck: summaryAfterFirstAck.resources.patients,
                afterLocalUpdate: summaryAfterLocalUpdate.resources.patients,
                afterSecondAck: summaryAfterSecondAck.resources.patients,
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
//# sourceMappingURL=sync-state-smoke.js.map