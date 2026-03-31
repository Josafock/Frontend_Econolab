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
    process.env.DATABASE_SQLITE_PATH ??= (0, node_path_1.resolve)(process.cwd(), 'tmp', 'phase16-sqlite-service-folio.sqlite');
    (0, node_fs_1.mkdirSync)((0, node_path_1.dirname)(process.env.DATABASE_SQLITE_PATH), { recursive: true });
    (0, node_fs_1.rmSync)(process.env.DATABASE_SQLITE_PATH, { force: true });
    const { default: appDataSource } = await Promise.resolve().then(() => require('../src/database/typeorm.datasource'));
    const { getAppRuntimeConfig } = await Promise.resolve().then(() => require('../src/config/app.config'));
    const { getDatabaseRuntimeConfig } = await Promise.resolve().then(() => require('../src/config/database.config'));
    const { getLabRuntimeConfig } = await Promise.resolve().then(() => require('../src/config/lab.config'));
    const { DatabaseDialectService } = await Promise.resolve().then(() => require('../src/database/database-dialect.service'));
    const { RuntimePolicyService } = await Promise.resolve().then(() => require('../src/runtime/runtime-policy.service'));
    const { ServicesService } = await Promise.resolve().then(() => require('../src/services/services.service'));
    const { Patient, PatientGender } = await Promise.resolve().then(() => require('../src/patients/entities/patient.entity'));
    const { Study, StudyStatus, StudyType } = await Promise.resolve().then(() => require('../src/studies/entities/study.entity'));
    const { ServiceItemPriceType, ServiceStatus } = await Promise.resolve().then(() => require('../src/services/entities/service-order.entity'));
    await appDataSource.initialize();
    try {
        await appDataSource.runMigrations();
        const configService = new config_1.ConfigService({
            app: getAppRuntimeConfig(process.env),
            database: getDatabaseRuntimeConfig(process.env),
            lab: getLabRuntimeConfig(process.env),
        });
        const databaseDialect = new DatabaseDialectService(configService);
        const runtimePolicy = new RuntimePolicyService(configService);
        const servicesService = new ServicesService(appDataSource.getRepository('service_orders'), appDataSource.getRepository('service_order_items'), appDataSource.getRepository('patients'), appDataSource.getRepository('doctors'), appDataSource.getRepository('studies'), configService, databaseDialect, runtimePolicy);
        const patientRepo = appDataSource.getRepository(Patient);
        const studyRepo = appDataSource.getRepository(Study);
        const serviceRepo = appDataSource.getRepository('service_orders');
        const patient = await patientRepo.save(patientRepo.create({
            firstName: 'Paciente',
            lastName: 'Offline',
            middleName: '',
            gender: PatientGender.OTHER,
            birthDate: '1990-01-01',
            phone: '7710000001',
            email: 'paciente.offline@test.local',
            addressLine: 'Calle 1',
            addressBetween: '',
            addressCity: 'Huejutla',
            addressState: 'Hidalgo',
            addressZip: '43000',
            documentType: 'ine',
            documentNumber: 'PAC-001',
        }));
        const study = await studyRepo.save(studyRepo.create({
            name: 'Biometria',
            code: 'BIO-001',
            description: 'Biometria hematica',
            durationMinutes: 60,
            type: StudyType.STUDY,
            normalPrice: 220,
            difPrice: 220,
            specialPrice: 220,
            hospitalPrice: 220,
            otherPrice: 220,
            defaultDiscountPercent: 0,
            method: '',
            indicator: '',
            packageStudyIds: [],
            status: StudyStatus.ACTIVE,
            isActive: true,
        }));
        const dateToken = servicesService.getLabDateToken(new Date('2026-03-29T22:34:00-06:00'));
        await serviceRepo.save(serviceRepo.create({
            folio: `ECO${dateToken}0001`,
            patientId: patient.id,
            doctorId: null,
            branchName: 'Unidad Movil',
            sampleAt: new Date('2026-03-30T04:34:00.000Z'),
            deliveryAt: new Date('2026-03-30T04:34:00.000Z'),
            status: 'pending',
            subtotalAmount: 220,
            courtesyPercent: 0,
            discountAmount: 0,
            totalAmount: 220,
            notes: null,
            items: [],
        }));
        const suggestion = await servicesService.getSuggestedFolio();
        const created = await servicesService.create({
            folio: '',
            autoGenerateFolio: true,
            patientId: patient.id,
            doctorId: undefined,
            branchName: 'Unidad Movil',
            sampleAt: '2026-03-30T04:34:00.000Z',
            deliveryAt: '2026-03-30T04:34:00.000Z',
            status: ServiceStatus.PENDING,
            courtesyPercent: 0,
            notes: '',
            items: [
                {
                    studyId: study.id,
                    priceType: ServiceItemPriceType.NORMAL,
                    quantity: 1,
                    discountPercent: 0,
                },
            ],
        });
        if (!suggestion.folio.endsWith('0002')) {
            throw new Error(`El siguiente folio esperado era 0002 y se obtuvo ${suggestion.folio}.`);
        }
        if (!created.folio.endsWith('0002')) {
            throw new Error(`El servicio creado debio usar el folio 0002 y se obtuvo ${created.folio}.`);
        }
        console.log(JSON.stringify({
            ok: true,
            suggestedFolio: suggestion.folio,
            createdFolio: created.folio,
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
//# sourceMappingURL=sqlite-service-folio-smoke.js.map