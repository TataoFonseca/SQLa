import pkg from "node-sql-parser";
import { transformSQL, needsSchemaInjection } from "./sqlTransformer.service.js";
const { Parser } = pkg;

const parser = new Parser();

export function parseSQL(sql, schemaName = null) {
    if (!sql || typeof sql !== "string") {
        throw new Error("El SQL debe ser un string válido");
    }

    const cleanSQL = sql.trim();
    if (!cleanSQL) {
        throw new Error("El SQL está vacío");
    }

    const opt = { database: "Postgresql" };

    let originalAST;
    try {
        originalAST = parser.astify(cleanSQL, opt);
    } catch (err) {
        throw new Error("SQL inválido: " + err.message);
    }

    // Si hay schema, transformar el SQL
    let transformedSQL = cleanSQL;
    let transformedAST = originalAST;
    let needsSchema = false;

    if (schemaName) {
        const transformResult = transformSQL(cleanSQL, schemaName);
        if (transformResult.success) {
            transformedSQL = transformResult.transformed;
            transformedAST = transformResult.ast;
            needsSchema = true;
        } else {
            // Si falla la transformación, usamos el SQL original
            console.warn(' Transformación falló, usando SQL original:', transformResult.error);
            transformedSQL = cleanSQL;
        }
    }

    // Usar el SQL transformado para extraer tablas y columnas
    let tables = [];
    let columns = [];

    try {
        tables = parser
            .tableList(transformedSQL, opt)
            .filter(t => typeof t === "string");
    } catch (err) {
        console.warn("Error extrayendo tablas:", err.message);
    }

    try {
        columns = parser
            .columnList(transformedSQL, opt)
            .filter(c => typeof c === "string");
    } catch (err) {
        console.warn("Error extrayendo columnas:", err.message);
    }

    return {
        ast: transformedAST,
        originalAST: originalAST,
        tables,
        columns,
        originalSQL: cleanSQL,
        transformedSQL,
        needsSchema,
        sql: transformedSQL,
        sqlForExecution: transformedSQL
    };
}