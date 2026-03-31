"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomToken = generateRandomToken;
const crypto_1 = require("crypto");
function generateRandomToken(length = 6) {
    if (length < 1 || length > 15) {
        throw new Error('generateRandomToken length must be between 1 and 15');
    }
    const max = 10 ** length;
    const num = (0, crypto_1.randomInt)(0, max);
    return num.toString().padStart(length, '0');
}
//# sourceMappingURL=token.util.js.map