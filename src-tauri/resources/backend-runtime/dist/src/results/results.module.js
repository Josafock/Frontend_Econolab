"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const results_service_1 = require("./results.service");
const results_controller_1 = require("./results.controller");
const study_result_entity_1 = require("./entities/study-result.entity");
const service_order_entity_1 = require("../services/entities/service-order.entity");
const study_detail_entity_1 = require("../studies/entities/study-detail.entity");
let ResultsModule = class ResultsModule {
};
exports.ResultsModule = ResultsModule;
exports.ResultsModule = ResultsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                study_result_entity_1.StudyResult,
                study_result_entity_1.StudyResultValue,
                service_order_entity_1.ServiceOrder,
                service_order_entity_1.ServiceOrderItem,
                study_detail_entity_1.StudyDetail,
            ]),
        ],
        controllers: [results_controller_1.ResultsController],
        providers: [results_service_1.ResultsService],
        exports: [results_service_1.ResultsService],
    })
], ResultsModule);
//# sourceMappingURL=results.module.js.map