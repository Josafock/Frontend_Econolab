"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrationDataSourceOptions = void 0;
require("dotenv/config");
const node_path_1 = require("node:path");
const typeorm_1 = require("typeorm");
const database_config_1 = require("../config/database.config");
const sync_outbox_subscriber_1 = require("../sync/subscribers/sync-outbox.subscriber");
const baseDir = __dirname;
const database = (0, database_config_1.getDatabaseRuntimeConfig)();
exports.migrationDataSourceOptions = {
    ...(0, database_config_1.buildTypeOrmDataSourceOptions)(database, [(0, node_path_1.join)(baseDir, '..', '**', '*.entity.{ts,js}')], [(0, node_path_1.join)(baseDir, 'migrations', '[0-9]*-*.{ts,js}')]),
    subscribers: [sync_outbox_subscriber_1.SyncOutboxSubscriber],
};
const appDataSource = new typeorm_1.DataSource(exports.migrationDataSourceOptions);
exports.default = appDataSource;
//# sourceMappingURL=typeorm.datasource.js.map