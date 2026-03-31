"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeServiceStudies = summarizeServiceStudies;
function summarizeServiceStudies(service) {
    const packageGroups = new Map();
    const standaloneStudies = [];
    for (const item of service.items ?? []) {
        if (item.sourcePackageNameSnapshot) {
            const current = packageGroups.get(item.sourcePackageNameSnapshot) ?? [];
            current.push(item.studyNameSnapshot);
            packageGroups.set(item.sourcePackageNameSnapshot, current);
            continue;
        }
        standaloneStudies.push(item.studyNameSnapshot);
    }
    return [
        ...[...packageGroups.entries()].map(([packageName, studies]) => `${packageName}: ${studies.join(', ')}`),
        ...standaloneStudies,
    ].join(' | ');
}
//# sourceMappingURL=service-order-summary.util.js.map