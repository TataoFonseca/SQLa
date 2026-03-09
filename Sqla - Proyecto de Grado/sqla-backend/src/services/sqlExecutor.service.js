import { getPool } from "../db/mssql.js";
import { securityCheck } from "./sqlSecurity.service.js";
import { parseSQL } from "./sqlParser.service.js";

export async function executeSQL(sqlQuery, schemaName) {

    const secure = securityCheck(sqlQuery);
    if (!secure.ok) {
        throw new Error(secure.message);
    }

    // Parsear y transformar el SQL con el schema
    const parsed = parseSQL(sqlQuery, schemaName);

    // Usar el SQL transformado para ejecutar
    const sqlToExecute = parsed.transformedSQL || sqlQuery;

    // Validación MEJORADA: Solo buscar schemas válidos (letras, guiones bajos)
    // Excluir números decimales y otros patrones que no sean schemas reales
    const schemaRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\.[a-zA-Z_][a-zA-Z0-9_]*/g;
    const matches = [...sqlToExecute.matchAll(schemaRegex)];

    const uniqueSchemas = new Set();
    for (const match of matches) {
        const usedSchema = match[1];

        // Ignorar si parece un número decimal (como 999.99)
        if (/^\d+$/.test(usedSchema)) {
            continue;
        }

        // Ignorar si contiene @ (posible email)
        if (usedSchema.includes('@')) {
            console.log('⏭️ Ignorando posible email como schema:', usedSchema);
            continue;
        }

        // Verificar que no estamos dentro de una cadena de texto
        const beforeMatch = sqlToExecute.substring(0, match.index);
        const quoteCount = (beforeMatch.match(/'/g) || []).length;

        // Si estamos dentro de comillas simples (número impar de comillas antes), no es un schema real
        if (quoteCount % 2 === 1) {
            console.log('⏭️ Ignorando posible schema dentro de string:', usedSchema);
            continue;
        }

        uniqueSchemas.add(usedSchema);
    }

    // Validar cada schema encontrado
    for (const usedSchema of uniqueSchemas) {
        // Permitir solo el schema actual y schemas del sistema
        if (usedSchema.toLowerCase() !== schemaName.toLowerCase() &&
            !['dbo', 'sys', 'information_schema'].includes(usedSchema.toLowerCase())) {
            throw new Error(`No puedes acceder al schema "${usedSchema}". Solo puedes acceder a tu propio schema.`);
        }
    }

    // ==========================================
    // TRY/CATCH PARA EJECUTAR LA CONSULTA
    // ==========================================
    try {
        const pool = await getPool();

        // Ejecutar la consulta transformada
        const finalQuery = `
            SET NOCOUNT ON;
            ${sqlToExecute}
        `;

        console.log('🔍 Ejecutando SQL:', finalQuery);

        const result = await pool.request().query(finalQuery);

        return {
            rows: result.recordset || [],
            rowsAffected: result.rowsAffected || [],
            originalSQL: sqlQuery,
            transformedSQL: sqlToExecute,
            message: "Consulta ejecutada correctamente"
        };

    } catch (error) {
        // ==========================================
        // CAPTURA DETALLADA DEL ERROR DE SQL SERVER
        // ==========================================
        console.error("❌ ERROR DETALLADO DE SQL SERVER:");
        console.error("   Mensaje:", error.message);
        console.error("   Código:", error.code);
        console.error("   Número:", error.number);
        console.error("   Estado:", error.state);
        console.error("   Clase:", error.class);
        console.error("   Procedimiento:", error.procName);
        console.error("   Línea:", error.lineNumber);
        console.error("   Nombre del error:", error.name);

        // Mostrar errores previos si existen (los importantes para FK)
        if (error.precedingErrors && error.precedingErrors.length > 0) {
            console.error("📌 ERRORES PREVIOS (los importantes):");
            error.precedingErrors.forEach((err, i) => {
                console.error(`   [${i}] Mensaje:`, err.message);
                console.error(`       Número:`, err.number);
            });
        }

        // Mostrar el error completo como objeto
        console.error("📦 Error completo:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

        // Errores específicos para mensajes amigables
        if (error.message.includes("There is already an object named")) {
            throw new Error(`La tabla ya existe en tu schema. Las tablas son aisladas por sesión.`);
        }

        if (error.message.includes("FOREIGN KEY") || error.number === 547) {
            console.error("🔍 ERROR DE FOREIGN KEY DETECTADO");
            // Si hay errores previos, el primero suele ser el más específico
            if (error.precedingErrors && error.precedingErrors.length > 0) {
                throw new Error(`Error de FOREIGN KEY: ${error.precedingErrors[0].message}`);
            }
        }

        throw new Error(error.message);
    }
}





