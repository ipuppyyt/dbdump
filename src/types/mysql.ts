export interface MySQLDumpConfig {
    host: string;
    user: string;
    password?: string;
    database: string;
    port?: number;
    outputFile?: string;
}