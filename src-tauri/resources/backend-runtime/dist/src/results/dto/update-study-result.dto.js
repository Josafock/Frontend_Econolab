"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateStudyResultDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_study_result_dto_1 = require("./create-study-result.dto");
class UpdateStudyResultDto extends (0, mapped_types_1.PartialType)(create_study_result_dto_1.CreateStudyResultDto) {
}
exports.UpdateStudyResultDto = UpdateStudyResultDto;
//# sourceMappingURL=update-study-result.dto.js.map