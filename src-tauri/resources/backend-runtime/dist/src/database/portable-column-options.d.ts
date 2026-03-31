import type { ColumnOptions } from 'typeorm';
type PortableTimestampMode = 'timestamp' | 'timestamptz';
export declare function getPortableTimestampColumnOptions(options?: Omit<ColumnOptions, 'type'>, mode?: PortableTimestampMode): ColumnOptions;
export declare function getPortableCreateDateColumnOptions(options?: Omit<ColumnOptions, 'type'>, mode?: PortableTimestampMode): ColumnOptions;
export declare function getPortableUpdateDateColumnOptions(options?: Omit<ColumnOptions, 'type'>, mode?: PortableTimestampMode): ColumnOptions;
export declare function getPortableEnumColumnOptions<T extends Record<string, string>>(enumValues: T, defaultValue?: T[keyof T], options?: Omit<ColumnOptions, 'type' | 'enum' | 'default'>): ColumnOptions;
export declare function getPortableJsonColumnOptions(defaultValue?: string, options?: Omit<ColumnOptions, 'type' | 'default'>): ColumnOptions;
export declare function getPortableIntegerArrayColumnOptions(options?: Omit<ColumnOptions, 'type' | 'array' | 'default'>): ColumnOptions;
export declare function getPortableGeneratedPrimaryColumnOptions(preferBigInt?: boolean): {
    type: "integer";
} | {
    type: "bigint";
} | {
    type: "int";
};
export {};
