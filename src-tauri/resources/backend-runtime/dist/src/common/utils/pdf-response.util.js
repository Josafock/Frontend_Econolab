"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInlinePdf = sendInlinePdf;
const file_response_util_1 = require("./file-response.util");
function sendInlinePdf(response, filename, buffer) {
    (0, file_response_util_1.sendBufferResponse)(response, {
        contentType: 'application/pdf',
        filename,
        buffer,
    });
}
//# sourceMappingURL=pdf-response.util.js.map