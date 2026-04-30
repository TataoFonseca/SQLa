import sql from "mssql";
import dotenv from "dotenv";
import { resolve, dirname } from "path";

// En pkg: .env vive junto al .exe. En dev: dotenv busca en process.cwd().
if (process.pkg) {
    dotenv.config({ path: resolve(dirname(process.execPath), ".env") });
} else {
    dotenv.config();
}

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    pool: {
        max: 30, // soporta alta concurrencia
        min: 1,
        idleTimeoutMillis: 300000   // 5 min — evita que conexiones idle se cierren entre consultas
    },
    options: {
        port: Number(process.env.DB_PORT) || 1433,  // puerto estático (fijado en SQL Server Config Manager)
        encrypt: false,
        trustServerCertificate: true
    }
};

let pool = null;

export async function getPool() {
    if (!pool) {
        pool = await sql.connect(config);
        console.log("Conexión exitosa a la base de datos y/o SQL SERVER");
    }
    return pool;
}