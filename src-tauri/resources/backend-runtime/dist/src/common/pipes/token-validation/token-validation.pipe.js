"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenValidationPipe = void 0;
const common_1 = require("@nestjs/common");
let TokenValidationPipe = class TokenValidationPipe {
    regex = /^\d{6}$/;
    transform(value) {
        if (!this.regex.test(value)) {
            throw new common_1.BadRequestException('Token no válido');
        }
        return value;
    }
};
exports.TokenValidationPipe = TokenValidationPipe;
exports.TokenValidationPipe = TokenValidationPipe = __decorate([
    (0, common_1.Injectable)()
], TokenValidationPipe);
//# sourceMappingURL=token-validation.pipe.js.map