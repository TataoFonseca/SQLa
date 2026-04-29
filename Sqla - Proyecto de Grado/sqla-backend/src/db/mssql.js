import sql from "mssql";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Resolver la ruta al .env relativo a este archivo (src/.env),
// independientemente del directorio desde donde se ejecute Node.
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    pool: {
        max: 60, // soporta hasta 60 conexiones simultáneas
        min: 1,
        idleTimeoutMillis: 300000   // 5 min — evita que conexiones idle se cierren entre consultas
    },
    options: {
        port: Number(process.env.DB_PORT) || 1433,  // puerto estático (fijado en SQL Server Config Manager)
        encrypt: true,
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