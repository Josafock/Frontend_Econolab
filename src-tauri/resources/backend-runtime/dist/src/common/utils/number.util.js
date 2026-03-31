"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toFiniteNumber = toFiniteNumber;
function toFiniteNumber(value) {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}
//# sourceMappingURL=number.util.js.map