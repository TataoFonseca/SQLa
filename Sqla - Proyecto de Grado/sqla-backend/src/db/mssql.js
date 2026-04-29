import sql from "mssql";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// En producción (pkg): .env vive junto al .exe.
// En desarrollo: está en sqla-backend/src/.env
const envPath = process.pkg
    ? resolve(dirname(process.execPath), ".env")
    : resolve(__dirname, "../.env");

dotenv.config({ path: envPath });

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