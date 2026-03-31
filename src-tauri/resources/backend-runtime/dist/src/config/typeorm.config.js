"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeOrmConfig = void 0;
const database_config_1 = require("./database.config");
const sync_outbox_subscriber_1 = require("../sync/subscribers/sync-outbox.subscriber");
const typeOrmConfig = (configService) => ({
    ...(0, database_config_1.buildTypeOrmModuleOptions)(configService.getOrThrow('database')),
    subscribers: [sync_outbox_subscriber_1.SyncOutboxSubscriber],
});
exports.typeOrmConfig = typeOrmConfig;
//# sourceMappingURL=typeorm.config.js.map