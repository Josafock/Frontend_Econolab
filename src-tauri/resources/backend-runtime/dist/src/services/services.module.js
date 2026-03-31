"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const services_service_1 = require("./services.service");
const services_controller_1 = require("./services.controller");
const service_order_entity_1 = require("./entities/service-order.entity");
const patient_entity_1 = require("../patients/entities/patient.entity");
const doctor_entity_1 = require("../doctors/entities/doctor.entity");
const study_entity_1 = require("../studies/entities/study.entity");
let ServicesModule = class ServicesModule {
};
exports.ServicesModule = ServicesModule;
exports.ServicesModule = ServicesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                service_order_entity_1.ServiceOrder,
                service_order_entity_1.ServiceOrderItem,
                patient_entity_1.Patient,
                doctor_entity_1.Doctor,
                study_entity_1.Study,
            ]),
        ],
        controllers: [services_controller_1.ServicesController],
        providers: [services_service_1.ServicesService],
        exports: [services_service_1.ServicesService],
    })
], ServicesModule);
//# sourceMappingURL=services.module.js.map