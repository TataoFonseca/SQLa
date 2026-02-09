import pkg from "node-sql-parser";
const { Parser } = pkg;

const parser = new Parser();

export function parseSQL(sql) {
    const opt = { database: "Postgresql" }; // o MySQL, da igual para DDL básico

    const ast = parser.astify(sql, opt);

    const tables = parser.tableList(sql, opt)
        .filter(t => typeof t === "string");

    const columns = parser.columnList(sql, opt)
        .filter(c => typeof c === "string");

    return {
        ast,
        tables,
        columns,
        sql: parser.sqlify(ast, opt)
    };
}
