import { getPool } from "../db/mssql.js";
import { securityCheck } from "./sqlSecurity.service.js";
import { parseSQL } from "./sqlParser.service.js";

/**
 * Extrae el primer nombre entre comillas simples de un mensaje de SQL Server.
 * Ej: "Invalid object name 'dbo.mi_tabla'." → "mi_tabla"
 * Usa split en lugar de regex para evitar problemas con tipos de comillas.
 */
function extractQuotedName(msg) {
    const parts = msg.split("'");
    // parts[1] es lo que está entre la primera y segunda comilla simple
    const raw = parts[1] ?? '';
    // Quitar prefijo de schema si viene como "schema.tabla"
    return raw.split('.').pop();
}

/**
 * Convierte un error de SQL Server a un mensaje legible en español.
 * Usa error.number (código numérico estable de SQL Server) como criterio principal.
 */
function humanizeSQLError(error) {
    const n = error.number;
    const msg = error.message || '';

    switch (n) {
        // ── Sintaxis ─────────────────────────────────────────────────
        case 102:
        case 156:
        case 319:
            return `Error de sintaxis en la consulta SQL. Verifica que todos los bloques estén bien conectados.`;
        case 105:
            return `Error de sintaxis: comilla no cerrada en un valor de texto.`;

        // ── SELECT sin FROM ──────────────────────────────────────────────────
        case 263:
            return `La consulta SELECT necesita una tabla de origen. Conecta un bloque FROM para indicar de qué tabla quieres obtener los datos.`;

        // ── Tabla o vista no existe ───────────────────────────────────
        case 208: {
            const name = extractQuotedName(msg);
            return `La tabla${name ? ` "${name}"` : ''} no existe. ¿La creaste primero con un bloque CREATE TABLE?`;
        }

        // ── Columna no existe ─────────────────────────────────────────
        case 207: {
            const name = extractQuotedName(msg);
            return `La columna${name ? ` "${name}"` : ''} no existe en la tabla. Verifica el nombre exacto de la columna y especifica de que tabla proviene.`;
        }

        // ── Tabla ya existe ───────────────────────────────────────────
        case 2714: {
            const name = extractQuotedName(msg);
            return `La tabla${name ? ` "${name}"` : ''} ya existe en tu sesión. No puedes crearla dos veces.`;
        }

        // ── Modificar tabla que no existe ─────────────────────────────
        case 4902:
            return `No se puede modificar la tabla porque no existe.`;

        // ── Violación de FK o CHECK ───────────────────────────────────
        case 547: {
            const preceding = error.precedingErrors?.[0]?.message ?? '';
            if (preceding) {
                const refName = extractQuotedName(preceding);
                return `Violación de FOREIGN KEY: el valor no existe en la tabla referenciada${refName ? ` "${refName}"` : ''}. Inserta primero el registro padre.`;
            }
            return `Violación de restricción (FOREIGN KEY o CHECK): el valor no cumple con las reglas de integridad definidas.`;
        }

        // ── Clave primaria / unique duplicada ─────────────────────────
        case 2627:
        case 2601:
            return `Valor duplicado: ya existe un registro con esa clave primaria o valor único. No se permiten duplicados.`;

        // ── Columna NOT NULL con valor nulo ───────────────────────────
        case 515: {
            const name = extractQuotedName(msg);
            return `La columna${name ? ` "${name}"` : ''} no permite valores nulos. Debes proporcionar un valor.`;
        }

        // ── Texto demasiado largo ─────────────────────────────────────
        case 8152:
            return `El valor de texto es demasiado largo para la columna. Reduce el texto o aumenta el tamaño del campo.`;

        // ── Conversión de tipos ───────────────────────────────────────
        case 245:
        case 8114:
        case 206:
            return `Error de tipo de dato: el valor no es compatible con el tipo de la columna.`;

        // ── División por cero ─────────────────────────────────────────
        case 8134:
            return `División por cero: una expresión en la consulta divide por cero.`;

        // ── Permisos ──────────────────────────────────────────────────
        case 229:
        case 230:
            return `No tienes permiso para realizar esta operación.`;

        // ── GROUP BY / Agregación ─────────────────────────────────────────────
        case 8120:
            return `Una columna del SELECT no está en GROUP BY ni dentro de una función de agregación. Agrégala al GROUP BY o envuélvela en COUNT, SUM, AVG, MIN o MAX.`;

        // ── Ambigüedad de columna ─────────────────────────────────────────────
        case 209: {
            const name = extractQuotedName(msg);
            return `La columna${name ? ` "${name}"` : ''} es ambigua — existe en más de una tabla. Especifica la tabla: tabla.${name || 'columna'}.`;
        }

        // ── Referencia no resuelta (alias o tabla mal escrita) ────────────────
        case 4104: {
            const name = extractQuotedName(msg);
            return `La referencia${name ? ` "${name}"` : ''} no se puede resolver. Verifica que el alias o nombre de tabla esté bien escrito en el FROM o JOIN.`;
        }

        // ── Agregación en WHERE ───────────────────────────────────────────────
        case 147:
            return `No puedes usar funciones de agregación (COUNT, SUM, AVG, MIN, MAX) en WHERE. Para filtrar grupos usa HAVING.`;


        // ── Fallback: mensaje original ────────────────────────────────
        default:
            return msg;
    }
}

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

        // Extraer orden y nombres de columnas desde los metadatos del driver mssql.
        // recordset.columns es un objeto { colName: { index, name, ... } } — pero
        // en JOINs con columnas del mismo nombre el driver las indexa así:
        // { NombreA: {...}, NombreB: {...}, NombreB_1: {...} }
        // Ordenamos por index para reproducir el orden original.
        let columnOrder = [];
        if (result.recordset && result.recordset.columns) {
            columnOrder = Object.values(result.recordset.columns)
                .sort((a, b) => a.index - b.index)
                .map(c => c.name);
        }

        return {
            rows: result.recordset || [],
            columnOrder,
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

        throw new Error(humanizeSQLError(error));
    }
}





