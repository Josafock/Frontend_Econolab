"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePortablePath = resolvePortablePath;
exports.findFirstExistingPath = findFirstExistingPath;
const fs = require("node:fs");
const path = require("node:path");
function resolvePortablePath(input) {
    const normalized = input?.trim();
    if (!normalized) {
        return null;
    }
    return path.isAbsolute(normalized)
        ? path.normalize(normalized)
        : path.resolve(process.cwd(), normalized);
}
function findFirstExistingPath(candidates) {
    for (const candidate of candidates) {
        const resolved = resolvePortablePath(candidate);
        if (resolved && fs.existsSync(resolved)) {
            return resolved;
        }
    }
    return null;
}
//# sourceMappingURL=asset-path.util.js.map