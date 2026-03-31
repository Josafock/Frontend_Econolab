"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJWT = generateJWT;
const jwt = require("jsonwebtoken");
function generateJWT(payload) {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error('Falta la variable de entorno JWT_SECRET');
    return jwt.sign(payload, secret, {
        expiresIn: '30d',
        algorithm: 'HS256',
    });
}
//# sourceMappingURL=jwt.util.js.map