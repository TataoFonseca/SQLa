import pkg from "node-sql-parser";
const { Parser } = pkg;

const parser = new Parser();

export function parseSQL(sql) {
    if (!sql || typeof sql !== "string") {
        throw new Error("El SQL debe ser un string válido");
    }

    const cleanSQL = sql.trim();
    if (!cleanSQL) {
        throw new Error("El SQL está vacío");
    }

    const opt = { database: "Postgresql" };

    let ast;
    try {
        ast = parser.astify(cleanSQL, opt);
    } catch (err) {
        throw new Error("SQL inválido: " + err.message);
    }

    const tables = parser
        .tableList(cleanSQL, opt)
        .filter(t => typeof t === "string");

    const columns = parser
        .columnList(cleanSQL, opt)
        .filter(c => typeof c === "string");

    return {
        ast,
        tables,
        columns,
        sql: parser.sqlify(ast, opt)
    };
}
