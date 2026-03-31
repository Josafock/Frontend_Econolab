"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.labConfig = void 0;
exports.getLabRuntimeConfig = getLabRuntimeConfig;
exports.buildLabResultUrl = buildLabResultUrl;
const config_1 = require("@nestjs/config");
const asset_path_util_1 = require("../common/utils/asset-path.util");
const DEFAULT_LOGO_PATH_CANDIDATES = [
    'src/public/logoeco.png',
    'public/logoeco.png',
    'dist/public/logoeco.png',
];
function renderResultTemplate(template, resultId) {
    return template.replace(/\{id\}/g, String(resultId));
}
function getLabRuntimeConfig(env = process.env) {
    return {
        name: env.LAB_NAME?.trim() || 'ECONOLAB',
        subtitle: env.LAB_SUBTITLE?.trim() || 'LABORATORIO DE ANALISIS CLINICOS',
        address: env.LAB_ADDRESS?.trim() || '',
        addressLine2: env.LAB_ADDRESS_2?.trim() || '',
        phone: env.LAB_PHONE?.trim() || '',
        email: env.LAB_EMAIL?.trim() || '',
        schedule: env.LAB_SCHEDULE?.trim() || '',
        sampleSchedule: env.LAB_SAMPLE_SCHEDULE?.trim() || '',
        responsibleName: env.LAB_RESPONSIBLE_NAME?.trim() || 'Responsable Sanitario',
        responsibleLicense: env.LAB_RESPONSIBLE_LICENSE?.trim() || '',
        logoPath: (0, asset_path_util_1.resolvePortablePath)(env.LAB_LOGO_PATH) ??
            (0, asset_path_util_1.findFirstExistingPath)(DEFAULT_LOGO_PATH_CANDIDATES),
        signaturePath: (0, asset_path_util_1.resolvePortablePath)(env.LAB_SIGNATURE_PATH),
        qrUrlTemplate: env.LAB_QR_URL?.trim() || '',
        qrBaseUrl: env.LAB_QR_BASE_URL?.trim() || '',
        qrPathTemplate: env.LAB_QR_PATH?.trim() || '/results/{id}',
    };
}
exports.labConfig = (0, config_1.registerAs)('lab', () => getLabRuntimeConfig());
function buildLabResultUrl(lab, resultId) {
    const urlTemplate = lab.qrUrlTemplate?.trim();
    if (urlTemplate) {
        return renderResultTemplate(urlTemplate, resultId);
    }
    const baseUrl = lab.qrBaseUrl?.trim();
    if (!baseUrl) {
        return null;
    }
    const renderedPath = renderResultTemplate(lab.qrPathTemplate || '/results/{id}', resultId);
    const normalizedPath = renderedPath.startsWith('/')
        ? renderedPath
        : `/${renderedPath}`;
    return `${baseUrl.replace(/\/$/, '')}${normalizedPath}`;
}
//# sourceMappingURL=lab.config.js.map