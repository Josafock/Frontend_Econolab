"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseDialectService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const search_normalization_util_1 = require("../common/utils/search-normalization.util");
const lab_date_util_1 = require("../common/utils/lab-date.util");
let DatabaseDialectService = class DatabaseDialectService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    get type() {
        return this.configService.getOrThrow('database').type;
    }
    buildCompactSearchExpression(expression) {
        return (0, search_normalization_util_1.buildCompactSearchSqlExpression)(expression, this.type);
    }
    buildDigitsOnlyExpression(expression) {
        return (0, search_normalization_util_1.buildDigitsOnlySqlExpression)(expression, this.type);
    }
    buildLowerTrimExpression(expression) {
        return (0, search_normalization_util_1.buildLowerTrimSqlExpression)(expression, this.type);
    }
    getLocalDateExpression(timeZone, expression) {
        return (0, lab_date_util_1.getLocalDateExpression)(timeZone, expression, this.type);
    }
    getDateTokenExpression(timeZone, expression) {
        return (0, lab_date_util_1.getLocalDateTokenExpression)(timeZone, expression, this.type);
    }
};
exports.DatabaseDialectService = DatabaseDialectService;
exports.DatabaseDialectService = DatabaseDialectService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DatabaseDialectService);
//# sourceMappingURL=database-dialect.service.js.map