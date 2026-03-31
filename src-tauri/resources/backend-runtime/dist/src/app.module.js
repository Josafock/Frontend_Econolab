"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const users_module_1 = require("./users/users.module");
const typeorm_config_1 = require("./config/typeorm.config");
const mail_module_1 = require("./mail/mail.module");
const auth_module_1 = require("./auth/auth.module");
const patients_module_1 = require("./patients/patients.module");
const doctors_module_1 = require("./doctors/doctors.module");
const studies_module_1 = require("./studies/studies.module");
const services_module_1 = require("./services/services.module");
const results_module_1 = require("./results/results.module");
const history_module_1 = require("./history/history.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const app_config_1 = require("./config/app.config");
const database_config_1 = require("./config/database.config");
const integrations_config_1 = require("./config/integrations.config");
const lab_config_1 = require("./config/lab.config");
const storage_config_1 = require("./config/storage.config");
const sync_config_1 = require("./config/sync.config");
const database_module_1 = require("./database/database.module");
const runtime_module_1 = require("./runtime/runtime.module");
const storage_module_1 = require("./storage/storage.module");
const sync_module_1 = require("./sync/sync.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [
                    app_config_1.appConfig,
                    database_config_1.databaseConfig,
                    integrations_config_1.integrationsConfig,
                    lab_config_1.labConfig,
                    storage_config_1.storageConfig,
                    sync_config_1.syncConfig,
                ],
            }),
            runtime_module_1.RuntimeModule,
            storage_module_1.StorageModule,
            database_module_1.DatabaseModule,
            sync_module_1.SyncModule,
            typeorm_1.TypeOrmModule.forRootAsync({
                useFactory: typeorm_config_1.typeOrmConfig,
                inject: [config_1.ConfigService],
            }),
            users_module_1.UsersModule,
            mail_module_1.MailModule,
            auth_module_1.AuthModule,
            patients_module_1.PatientsModule,
            doctors_module_1.DoctorsModule,
            studies_module_1.StudiesModule,
            services_module_1.ServicesModule,
            results_module_1.ResultsModule,
            history_module_1.HistoryModule,
            dashboard_module_1.DashboardModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map