"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDoctorDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_doctor_dto_1 = require("./create-doctor.dto");
class UpdateDoctorDto extends (0, mapped_types_1.PartialType)(create_doctor_dto_1.CreateDoctorDto) {
}
exports.UpdateDoctorDto = UpdateDoctorDto;
//# sourceMappingURL=update-doctor.dto.js.map