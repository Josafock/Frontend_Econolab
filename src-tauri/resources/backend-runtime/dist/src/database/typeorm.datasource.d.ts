import 'dotenv/config';
import { DataSource, type DataSourceOptions } from 'typeorm';
export declare const migrationDataSourceOptions: DataSourceOptions;
declare const appDataSource: DataSource;
export default appDataSource;
