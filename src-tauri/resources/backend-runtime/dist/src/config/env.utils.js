"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBooleanEnv = parseBooleanEnv;
exports.parseNumberEnv = parseNumberEnv;
exports.parseOptionalStringEnv = parseOptionalStringEnv;
exports.parseStringListEnv = parseStringListEnv;
const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);
function parseBooleanEnv(value, defaultValue) {
    const normalized = value?.trim().toLowerCase();
    if (!normalized) {
        return defaultValue;
    }
    if (TRUE_VALUES.has(normalized)) {
        return true;
    }
    if (FALSE_VALUES.has(normalized)) {
        return false;
    }
    return defaultValue;
}
function parseNumberEnv(value, defaultValue) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : defaultValue;
}
function parseOptionalStringEnv(value) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
}
function parseStringListEnv(value, defaultValue = []) {
    const parsed = value
        ?.split(',')
        .map((item) => item.trim())
        .filter(Boolean) ?? [];
    return parsed.length > 0 ? parsed : defaultValue;
}
//# sourceMappingURL=env.utils.js.map