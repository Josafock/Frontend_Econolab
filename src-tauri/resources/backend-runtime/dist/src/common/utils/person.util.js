"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPersonName = buildPersonName;
exports.formatAgeLabel = formatAgeLabel;
function buildPersonName(firstName, lastName, middleName) {
    return [firstName, lastName, middleName]
        .filter((part) => Boolean(part?.trim()))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function formatAgeLabel(birthDate, fallback = 'N/D') {
    if (!birthDate) {
        return fallback;
    }
    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) {
        return fallback;
    }
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDelta = today.getMonth() - birth.getMonth();
    if (monthDelta < 0 ||
        (monthDelta === 0 && today.getDate() < birth.getDate())) {
        age -= 1;
    }
    return `${age} años`;
}
//# sourceMappingURL=person.util.js.map