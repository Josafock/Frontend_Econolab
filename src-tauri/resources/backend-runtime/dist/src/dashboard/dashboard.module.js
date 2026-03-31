"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_login_log_entity_1 = require("../auth/entities/user-login-log.entity");
const doctor_entity_1 = require("../doctors/entities/doctor.entity");
const daily_closing_entity_1 = require("../history/entities/daily-closing.entity");
const patient_entity_1 = require("../patients/entities/patient.entity");
const service_order_entity_1 = require("../services/entities/service-order.entity");
const study_entity_1 = require("../studies/entities/study.entity");
const user_entity_1 = require("../users/entities/user.entity");
const dashboard_controller_1 = require("./dashboard.controller");
const dashboard_service_1 = require("./dashboard.service");
let DashboardModule = class DashboardModule {
};
exports.DashboardModule = DashboardModule;
exports.DashboardModule = DashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                service_order_entity_1.ServiceOrder,
                user_entity_1.User,
                user_login_log_entity_1.UserLoginLog,
                doctor_entity_1.Doctor,
                daily_closing_entity_1.DailyClosing,
                patient_entity_1.Patient,
                study_entity_1.Study,
            ]),
        ],
        controllers: [dashboard_controller_1.DashboardController],
        providers: [dashboard_service_1.DashboardService],
    })
], DashboardModule);
//# sourceMappingURL=dashboard.module.js.map