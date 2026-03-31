"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationExceptionFactory = validationExceptionFactory;
const common_1 = require("@nestjs/common");
function validationExceptionFactory(errors) {
    const formatted = flattenValidationErrors(errors);
    return new common_1.BadRequestException({ errors: formatted });
}
function flattenValidationErrors(errors) {
    const result = [];
    const walk = (errList, parentPath = '') => {
        for (const err of errList) {
            const path = parentPath ? `${parentPath}.${err.property}` : err.property;
            if (err.constraints) {
                Object.values(err.constraints).forEach((msg) => result.push({ field: path, message: msg }));
            }
            if (err.children?.length)
                walk(err.children, path);
        }
    };
    walk(errors);
    return result;
}
//# sourceMappingURL=validation-exception.factory.js.map