// sqla-backend/src/services/errorInterpreter.service.js
//
// Traduce mensajes de error de SQL Server a mensajes amigables en español.
// Se aplica en sql.controller.js antes de retornar el error al frontend.
//
// Patrón de uso:
//   import { interpretSqlError } from "./errorInterpreter.service.js";
//   return res.status(500).json({ ok: false, error: interpretSqlError(err.message) });
//NO SE ESTÁ USANDO, EN sqlExecutor.service.js SE ESTÁ USANDO un metodo humanize que se encargá de esto 
//─────────────────────────────────────────────────────────────────────────────

const ERROR_PATTERNS = [

  // ── GROUP BY / Agregación ──────────────────────────────────────────────────
  {
    pattern: /Column ['"]?(.+?)['"]? is invalid in the select list because it is not contained in either an aggregate function or the GROUP BY clause/i,
    message: (m) =>
      `La columna '${m[1]}' aparece en SELECT pero no está en GROUP BY ni dentro de una función de agregación (COUNT, SUM, AVG, MIN, MAX). Agrégala al GROUP BY o envuélvela en una función.`
  },
  {
    pattern: /An aggregate may not appear in the WHERE clause/i,
    message: () =>
      `Las funciones de agregación (COUNT, SUM, AVG, MIN, MAX) no pueden usarse en WHERE. Para filtrar resultados agrupados usa HAVING.`
  },
  {
    pattern: /Cannot perform an aggregate function on an expression containing an aggregate/i,
    message: () =>
      `No puedes anidar funciones de agregación (por ejemplo COUNT dentro de SUM). Si necesitas ese resultado, usa una subconsulta.`
  },

  // ── Columnas y tablas ──────────────────────────────────────────────────────
  {
    pattern: /Invalid column name ['"]?(.+?)['"]?/i,
    message: (m) =>
      `La columna '${m[1]}' no existe en ninguna de las tablas de la consulta. Verifica el nombre y que la tabla correcta esté en el FROM o JOIN.`
  },
  {
    pattern: /Invalid object name ['"]?(.+?)['"]?/i,
    message: (m) => {
      // Quitar el prefijo de schema (session_xxx.) para mostrar solo el nombre de tabla
      const fullName = m[1];
      const tableName = fullName.includes('.')
        ? fullName.split('.').pop().replace(/_[a-f0-9]{8}$/i, '')
        : fullName;
      return `La tabla '${tableName}' no existe en la base de datos. Verifica que el nombre esté escrito correctamente.`;
    }
  },
  {
    pattern: /Ambiguous column name ['"]?(.+?)['"]?/i,
    message: (m) =>
      `La columna '${m[1]}' existe en más de una tabla de la consulta. Especifica a qué tabla pertenece: tabla.${m[1]}.`
  },
  {
    pattern: /The multi-part identifier ["']?(.+?)["']? could not be bound/i,
    message: (m) =>
      `La referencia '${m[1]}' no se puede resolver. Verifica que el alias o nombre de tabla esté bien escrito y que la tabla esté en el FROM o JOIN.`
  },

  // ── Tipos de datos ─────────────────────────────────────────────────────────
  {
    pattern: /Conversion failed when converting the (.+?) value ['"](.+?)['"] to data type (.+?)\./i,
    message: (m) =>
      `No se puede convertir el valor '${m[2]}' al tipo de dato ${m[3]}. Verifica que estás comparando columnas y valores del mismo tipo.`
  },
  {
    pattern: /Error converting data type (.+?) to (.+?)\./i,
    message: (m) =>
      `No se puede convertir el tipo '${m[1]}' a '${m[2]}'. Verifica que los tipos de dato en la comparación sean compatibles.`
  },
  {
    pattern: /Operand type clash: (.+?) is incompatible with (.+)/i,
    message: (m) =>
      `Tipos incompatibles: no se puede operar '${m[1]}' con '${m[2]}'. Verifica los tipos de las columnas que estás comparando.`
  },

  // ── JOIN ───────────────────────────────────────────────────────────────────
  {
    pattern: /The column prefix ['"]?(.+?)['"]? does not match with a table name or alias name used in the query/i,
    message: (m) =>
      `El prefijo de tabla '${m[1]}' no corresponde a ninguna tabla o alias en la consulta. Verifica que el alias esté definido en el FROM o JOIN.`
  },

  // ── Objetos duplicados ─────────────────────────────────────────────────────
  {
    pattern: /There is already an object named ['"]?(.+?)['"]? in the database/i,
    message: (m) =>
      `Ya existe una tabla llamada '${m[1]}' en tu sesión. Si quieres recrearla, primero elimínala.`
  },

  // ── Restricciones de integridad ────────────────────────────────────────────
  {
    pattern: /The (.+?) statement conflicted with the FOREIGN KEY constraint/i,
    message: () =>
      `La operación viola una restricción de llave foránea (FOREIGN KEY). Verifica que los valores referenciados existan en la tabla relacionada.`
  },
  {
    pattern: /Violation of PRIMARY KEY constraint/i,
    message: () =>
      `Violación de llave primaria (PRIMARY KEY). Ya existe un registro con ese valor en la columna PK.`
  },
  {
    pattern: /Violation of UNIQUE KEY constraint/i,
    message: () =>
      `Violación de restricción UNIQUE. Ya existe un registro con ese valor en una columna que debe ser única.`
  },
  {
    pattern: /Cannot insert the value NULL into column ['"]?(.+?)['"]?/i,
    message: (m) =>
      `La columna '${m[1]}' no acepta valores NULL. Debes proporcionar un valor para esa columna.`
  },

  // ── Sintaxis SQL Server ────────────────────────────────────────────────────
  {
    pattern: /Incorrect syntax near ['"]?(.+?)['"]?/i,
    message: (m) =>
      `Error de sintaxis cerca de '${m[1]}'. Verifica que la consulta esté bien construida en esa sección.`
  },
  {
    pattern: /Unclosed quotation mark after the character string/i,
    message: () =>
      `Falta cerrar una comilla simple en la consulta. Verifica que todos los textos entre comillas estén correctamente cerrados.`
  },

  // ── Placeholders de bloques incompletos (generados por SQLa) ──────────────
  {
    pattern: /condición ON requerida/i,
    message: () =>
      `El bloque JOIN no tiene condición ON. Conecta un bloque de comparación al conector ON del JOIN.`
  },

  // ── Timeout / conexión ────────────────────────────────────────────────────
  {
    pattern: /Failed to connect|ETIMEOUT|connection timeout/i,
    message: () =>
      `No se pudo conectar al servidor de base de datos. Verifica que el servidor esté activo.`
  },
  {
    pattern: /Request timeout|query timeout/i,
    message: () =>
      `La consulta tardó demasiado en ejecutarse. Intenta simplificarla o agregar filtros.`
  },
];

/**
 * Intenta traducir un mensaje de error de SQL Server a español amigable.
 * Si no coincide con ningún patrón conocido, retorna el mensaje original.
 *
 * @param {string} rawMessage  Mensaje de error original de SQL Server / Node.js
 * @returns {string}           Mensaje traducido o el original si no hay match
 */
export function interpretSqlError(rawMessage) {
  if (!rawMessage || typeof rawMessage !== 'string') return rawMessage;

  for (const { pattern, message } of ERROR_PATTERNS) {
    const match = rawMessage.match(pattern);
    if (match) return message(match);
  }

  // Sin match — retornar original limpio (sin stack trace si lo hubiera)
  return rawMessage.split('\n')[0].trim();
}
