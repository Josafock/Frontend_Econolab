"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateStudyDetailDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_study_detail_dto_1 = require("./create-study-detail.dto");
class UpdateStudyDetailDto extends (0, mapped_types_1.PartialType)(create_study_detail_dto_1.CreateStudyDetailDto) {
}
exports.UpdateStudyDetailDto = UpdateStudyDetailDto;
//# sourceMappingURL=update-study-detail.dto.js.map