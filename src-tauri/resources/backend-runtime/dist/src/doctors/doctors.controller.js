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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const create_doctor_dto_1 = require("./dto/create-doctor.dto");
const update_doctor_status_dto_1 = require("./dto/update-doctor-status.dto");
const update_doctor_dto_1 = require("./dto/update-doctor.dto");
const doctors_service_1 = require("./doctors.service");
let DoctorsController = class DoctorsController {
    doctorsService;
    constructor(doctorsService) {
        this.doctorsService = doctorsService;
    }
    search(search = '', page = 1, limit = 10, status) {
        return this.doctorsService.search(search, +page, +limit, status);
    }
    exists(licenseNumber) {
        return this.doctorsService.existsByLicense(licenseNumber);
    }
    async create(dto) {
        const doctor = await this.doctorsService.create(dto);
        return {
            message: 'Medico creado correctamente.',
            data: doctor,
        };
    }
    findOne(id) {
        return this.doctorsService.findOne(+id);
    }
    async update(id, dto) {
        const doctor = await this.doctorsService.update(+id, dto);
        return {
            message: 'Medico actualizado correctamente.',
            data: doctor,
        };
    }
    async updateStatus(id, dto) {
        const doctor = await this.doctorsService.updateStatus(+id, dto);
        return {
            message: dto.isActive
                ? 'Medico activado correctamente.'
                : 'Medico desactivado correctamente.',
            data: doctor,
        };
    }
    remove(id) {
        return this.doctorsService.softDelete(+id);
    }
    hardRemove(id) {
        return this.doctorsService.hardDelete(+id);
    }
};
exports.DoctorsController = DoctorsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String]),
    __metadata("design:returntype", void 0)
], DoctorsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('exists'),
    __param(0, (0, common_1.Query)('licenseNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DoctorsController.prototype, "exists", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_doctor_dto_1.CreateDoctorDto]),
    __metadata("design:returntype", Promise)
], DoctorsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DoctorsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_doctor_dto_1.UpdateDoctorDto]),
    __metadata("design:returntype", Promise)
], DoctorsController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_doctor_status_dto_1.UpdateDoctorStatusDto]),
    __metadata("design:returntype", Promise)
], DoctorsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DoctorsController.prototype, "remove", null);
__decorate([
    (0, common_1.Delete)(':id/hard'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DoctorsController.prototype, "hardRemove", null);
exports.DoctorsController = DoctorsController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('doctors'),
    __metadata("design:paramtypes", [doctors_service_1.DoctorsService])
], DoctorsController);
//# sourceMappingURL=doctors.controller.js.map