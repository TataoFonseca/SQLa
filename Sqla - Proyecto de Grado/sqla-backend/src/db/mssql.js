import sql from "mssql";

const config = {
    user: "sqla_executor",
    password: "Sqla2026*",
    server: "localhost",
    database: "sqla_sandbox",
    port: 1433,
    pool: {
        max: 30,          // soporta alta concurrencia
        min: 5,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

let pool = null;

export async function getPool() {
    if (!pool) {
        pool = await sql.connect(config);
    }
    return pool;
}