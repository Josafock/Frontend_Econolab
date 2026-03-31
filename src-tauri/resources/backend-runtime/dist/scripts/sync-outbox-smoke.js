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
    process.env.DATABASE_SQLITE_PATH ??= (0, node_path_1.resolve)(process.cwd(), 'tmp', 'phase11-sync-outbox.sqlite');
    (0, node_fs_1.mkdirSync)((0, node_path_1.dirname)(process.env.DATABASE_SQLITE_PATH), { recursive: true });
    (0, node_fs_1.rmSync)(process.env.DATABASE_SQLITE_PATH, { force: true });
    const { default: appDataSource } = await Promise.resolve().then(() => require('../src/database/typeorm.datasource'));
    const { Patient, PatientGender } = await Promise.resolve().then(() => require('../src/patients/entities/patient.entity'));
    const { getSyncRuntimeConfig } = await Promise.resolve().then(() => require('../src/config/sync.config'));
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
            firstName: 'Sync',
            lastName: 'Smoke',
            gender: PatientGender.OTHER,
            birthDate: '1990-01-01',
            isActive: true,
            documentType: 'sync-smoke',
            documentNumber: `phase11-${Date.now()}`,
        });
        const created = await patientRepo.save(patient);
        created.phone = '5550001111';
        const updated = await patientRepo.save(created);
        updated.isActive = false;
        updated.deletedAt = new Date();
        const softDeleted = await patientRepo.save(updated);
        await patientRepo.remove(softDeleted);
        const summaryBeforeClaim = await outboxService.getSummary();
        const claimed = await outboxService.claimPendingBatch(10);
        const ackResult = claimed.leaseToken
            ? await outboxService.markAsSynced(claimed.leaseToken)
            : { affected: 0 };
        const events = await outboxRepo.find({ order: { id: 'ASC' } });
        const summaryAfterAck = await outboxService.getSummary();
        console.log(JSON.stringify({
            ok: true,
            eventCount: events.length,
            summaryBeforeClaim,
            claimedLeaseToken: claimed.leaseToken,
            claimedCount: claimed.events.length,
            ackAffected: ackResult.affected,
            finalStatuses: events.map((event) => event.status),
            operations: events.map((event) => event.operation),
            resourceTypes: [...new Set(events.map((event) => event.resourceType))],
            syncOrigins: [...new Set(events.map((event) => event.syncOrigin))],
            syncVersions: events.map((event) => event.syncVersion),
            summaryAfterAck,
            lastPayload: events.at(-1)?.payload ?? null,
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
//# sourceMappingURL=sync-outbox-smoke.js.map