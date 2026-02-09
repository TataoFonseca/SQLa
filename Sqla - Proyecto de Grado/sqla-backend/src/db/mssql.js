import sql from "mssql";

const config = {
    user: "sqla_user",
    password: "Sqla2026*",
    server: "localhost",
    database: "sqla",
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

let pool;

export async function getPool() {
    if (!pool) {
        pool = await sql.connect(config);
        console.log("✅ Conectado a SQL Server");
    }
    return pool;
}
