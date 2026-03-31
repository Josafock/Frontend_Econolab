import { Request } from 'express';
import { Role } from '../enums/roles.enum';
export interface AuthenticatedUser {
    id: string;
    email: string;
    rol: Role;
    jti: string;
}
export type RequestWithUser<TUser = AuthenticatedUser> = Request & {
    user: TUser;
};
