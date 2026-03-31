"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionZodFilter = void 0;
const common_1 = require("@nestjs/common");
function normalizeErrorItem(item) {
    if (typeof item === 'string') {
        return { message: item };
    }
    if (item && typeof item === 'object') {
        const candidate = item;
        return {
            message: typeof candidate.message === 'string'
                ? candidate.message
                : 'Error inesperado',
            code: typeof candidate.code === 'string' ? candidate.code : undefined,
            field: typeof candidate.field === 'string' ? candidate.field : undefined,
        };
    }
    return { message: 'Error inesperado' };
}
let HttpExceptionZodFilter = class HttpExceptionZodFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const status = exception.getStatus?.() ?? common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const exceptionRes = exception.getResponse?.();
        const payload = {
            errors: [],
        };
        if (typeof exceptionRes === 'string') {
            payload.errors.push({ message: exceptionRes });
        }
        else if (typeof exceptionRes === 'object' && exceptionRes !== null) {
            const obj = exceptionRes;
            if (Array.isArray(obj.errors)) {
                payload.errors = obj.errors.map(normalizeErrorItem);
            }
            else if (Array.isArray(obj.message)) {
                payload.errors = obj.message.map((message) => normalizeErrorItem(message));
            }
            else if (typeof obj.message === 'string') {
                payload.errors.push({ message: obj.message });
            }
            else {
                payload.errors.push({ message: 'Error inesperado' });
            }
        }
        else {
            payload.errors.push({ message: 'Error inesperado' });
        }
        response.status(status).json(payload);
    }
};
exports.HttpExceptionZodFilter = HttpExceptionZodFilter;
exports.HttpExceptionZodFilter = HttpExceptionZodFilter = __decorate([
    (0, common_1.Catch)(common_1.HttpException)
], HttpExceptionZodFilter);
//# sourceMappingURL=http-exception-zod.filter.js.map