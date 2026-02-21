import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    pool: {
        max: 30,          // soporta alta concurrencia
        min: 5,
        idleTimeoutMillis: 30000
    },
    options: {
        port: Number(process.env.DB_PORT) || 1433,
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