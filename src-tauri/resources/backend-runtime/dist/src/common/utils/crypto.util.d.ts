export declare const hashPassword: (password: string) => Promise<string>;
export declare const checkPassword: (enteredPassword: string, hash: string) => Promise<boolean>;
