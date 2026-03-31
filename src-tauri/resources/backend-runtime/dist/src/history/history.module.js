"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const service_order_entity_1 = require("../services/entities/service-order.entity");
const daily_closing_entity_1 = require("./entities/daily-closing.entity");
const history_controller_1 = require("./history.controller");
const history_service_1 = require("./history.service");
let HistoryModule = class HistoryModule {
};
exports.HistoryModule = HistoryModule;
exports.HistoryModule = HistoryModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([service_order_entity_1.ServiceOrder, daily_closing_entity_1.DailyClosing])],
        controllers: [history_controller_1.HistoryController],
        providers: [history_service_1.HistoryService],
    })
], HistoryModule);
//# sourceMappingURL=history.module.js.map