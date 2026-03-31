"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const auth_events_service_1 = require("./auth-events.service");
const google_auth_availability_guard_1 = require("./guards/google-auth-availability.guard");
const google_strategy_1 = require("./strategies/google.strategy");
const users_module_1 = require("../users/users.module");
const user_login_log_entity_1 = require("./entities/user-login-log.entity");
const user_entity_1 = require("../users/entities/user.entity");
const user_session_entity_1 = require("./entities/user-session.entity");
const gmail_oauth_controller_1 = require("./gmail-oauth.controller");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            passport_1.PassportModule,
            typeorm_1.TypeOrmModule.forFeature([user_login_log_entity_1.UserLoginLog, user_entity_1.User, user_session_entity_1.UserSession]),
            users_module_1.UsersModule,
        ],
        controllers: [auth_controller_1.AuthController, gmail_oauth_controller_1.GmailOauthController],
        providers: [
            auth_service_1.AuthService,
            jwt_strategy_1.JwtStrategy,
            auth_events_service_1.AuthEventsService,
            google_strategy_1.GoogleStrategy,
            google_auth_availability_guard_1.GoogleAuthAvailabilityGuard,
        ],
        exports: [auth_service_1.AuthService, auth_events_service_1.AuthEventsService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map