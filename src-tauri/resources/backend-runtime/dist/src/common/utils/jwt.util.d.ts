import * as jwt from 'jsonwebtoken';
import { Role } from '../enums/roles.enum';
export interface AppJwtPayload extends jwt.JwtPayload {
    sub: string;
    email: string;
    nombre: string;
    rol: Role;
    jti?: string;
    iat?: number;
    exp?: number;
}
export declare function generateJWT(payload: AppJwtPayload): string;
