import { MySQLDumpConfig } from '../types/mysql';
import { Connection, RowDataPacket } from 'mysql2/promise';
import * as mysql from 'mysql2/promise';
import { promises as fsPromises } from 'fs';

export class MySQLDumper {
    private config: MySQLDumpConfig;
    private connection!: Connection;

    constructor(config: MySQLDumpConfig) {
        this.config = config;
    }

    public async dump(): Promise<void> {
        await this.connect();

        const [tables] = await this.connection.query<RowDataPacket[]>(`SHOW TABLES`);
        const tableKey = `Tables_in_${this.config.database}`;
        let dumpSQL = `-- Dump of database ${this.config.database}\n\n`;

        for (const row of tables) {
            const tableName = row[tableKey];
            const [rows] = await this.connection.query<RowDataPacket[]>(`SELECT * FROM \`${tableName}\``);

            if (rows.length === 0) continue;

            const columns = Object.keys(rows[0]);
            for (const rowData of rows) {
                const values = columns.map(col => this.formatValue(rowData[col])).join(', ');
                dumpSQL += `INSERT INTO \`${tableName}\` (${columns.map(col => `\`${col}\``).join(', ')}) VALUES (${values});\n`;
            }

            dumpSQL += '\n';
        }

        await fsPromises.writeFile(this.config.outputFile || './dump.sql', dumpSQL);
        await this.connection.end();
    }

    private async connect(): Promise<void> {
        this.connection = await mysql.createConnection({
            host: this.config.host,
            user: this.config.user,
            password: this.config.password || '',
            database: this.config.database,
            port: this.config.port || 3306
        });
    }

    private formatValue(value: any): string {
        if (value === null || value === undefined) return 'NULL';
        if (typeof value === 'number') return value.toString();
        return `'${this.escapeString(value.toString())}'`;
    }

    private escapeString(str: string): string {
        return str
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    }
}