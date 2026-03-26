import pkg from "node-sql-parser";
import { transformSQL, needsSchemaInjection } from "./sqlTransformer.service.js";
const { Parser } = pkg;

const parser = new Parser();

/**
 * Convierte mensajes de error técnicos del parser a mensajes legibles en español.
 */
export function humanizeParseError(errMsg) {
    if (!errMsg) return "Error desconocido al procesar la consulta SQL.";

    const msg = errMsg.toString();

    // Errores de sintaxis genéricos del parser
    if (msg.includes("Expected") || msg.includes("Unexpected token") || msg.includes("Parse error")) {
        // Detectar token específico que falla
        const tokenMatch = msg.match(/but \"(.+?)\" found/i) || msg.match(/Unexpected token: (.+)/i);
        const token = tokenMatch ? `"${tokenMatch[1]}"` : "un símbolo inesperado";
        return `Error de sintaxis SQL: se encontró ${token} en un lugar inesperado. Revisa que los bloques estén conectados correctamente.`;
    }

    // TOP no soportado
    if (msg.includes("TOP") && msg.includes("not supported")) {
        return `La cláusula TOP no está soportada en el modo actual del parser.`;
    }

    // Tabla no encontrada
    if (msg.includes("Invalid object name") || msg.includes("object named")) {
        const tblMatch = msg.match(/named '(.+?)'/i);
        return tblMatch
            ? `La tabla "${tblMatch[1]}" no existe. ¿Ya ejecutaste el CREATE TABLE?`
            : "Una de las tablas referenciadas no existe en la base de datos.";
    }

    // Columna inválida
    if (msg.includes("Invalid column name")) {
        const colMatch = msg.match(/column name '(.+?)'/i);
        return colMatch
            ? `La columna "${colMatch[1]}" no existe en la tabla seleccionada.`
            : "Una de las columnas indicadas no existe en la tabla.";
    }

    // Ambiguous column
    if (msg.includes("Ambiguous column name")) {
        const colMatch = msg.match(/column name '(.+?)'/i);
        return colMatch
            ? `La columna "${colMatch[1]}" es ambigua. Usa un alias con AS o especifica la tabla (ej: Tabla.${colMatch[1]}).`
            : "Hay columnas con el mismo nombre en varias tablas. Usa AS para renombrarlas.";
    }

    // Foreign key
    if (msg.includes("FOREIGN KEY") || msg.includes("547")) {
        return "Error de clave foránea: estás intentando insertar un valor que no existe en la tabla relacionada.";
    }

    // Ya existe
    if (msg.includes("There is already an object named") || msg.includes("already exists")) {
        return "La tabla o el objeto ya existe. Usa DROP TABLE primero si deseas recrearla.";
    }

    // Conversión de tipos
    if (msg.includes("conversion failed") || msg.includes("Cannot convert")) {
        return "Error de tipo de dato: el valor ingresado no coincide con el tipo de la columna.";
    }

    // Sin sesión
    if (msg.includes("sesión") || msg.includes("session")) {
        return "No se encontró una sesión activa. Vuelve al inicio y crea una nueva sesión.";
    }

    // Fallback — devolver el mensaje original pero etiquetado
    return `Error SQL: ${msg}`;
}

export function parseSQL(sql, schemaName = null) {
    if (!sql || typeof sql !== "string") {
        throw new Error("El SQL debe ser un string válido");
    }

    const cleanSQL = sql.trim();
    if (!cleanSQL) {
        throw new Error("El SQL está vacío");
    }

    const opt = { database: "TransactSQL" };

    let originalAST;
    try {
        originalAST = parser.astify(cleanSQL, opt);
    } catch (err) {
        throw new Error(humanizeParseError(err.message));
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