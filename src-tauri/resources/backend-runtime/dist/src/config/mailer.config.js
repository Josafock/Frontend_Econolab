"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailerConfig = void 0;
const nodemailer_1 = require("nodemailer");
const mailerConfig = (integrationPolicy) => {
    const { user, pass } = integrationPolicy.mailCredentials;
    if (!integrationPolicy.mailEnabled || !user || !pass) {
        return (0, nodemailer_1.createTransport)({
            jsonTransport: true,
        });
    }
    return (0, nodemailer_1.createTransport)({
        service: 'gmail',
        auth: {
            user,
            pass,
        },
    });
};
exports.mailerConfig = mailerConfig;
//# sourceMappingURL=mailer.config.js.map