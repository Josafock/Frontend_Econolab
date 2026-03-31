"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBufferResponse = sendBufferResponse;
exports.sendAttachmentFile = sendAttachmentFile;
function sanitizeDownloadFilename(filename) {
    const normalized = filename
        .trim()
        .replace(/["\\\r\n]/g, '')
        .replace(/\s+/g, '-');
    return normalized || 'archivo';
}
function sendBufferResponse(response, options) {
    const disposition = options.disposition ?? 'inline';
    const filename = sanitizeDownloadFilename(options.filename);
    response.setHeader('Content-Type', options.contentType);
    response.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
    response.send(options.buffer);
}
function sendAttachmentFile(response, filename, contentType, buffer) {
    sendBufferResponse(response, {
        contentType,
        filename,
        disposition: 'attachment',
        buffer,
    });
}
//# sourceMappingURL=file-response.util.js.map