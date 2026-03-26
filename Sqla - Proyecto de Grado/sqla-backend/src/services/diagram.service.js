// sqla-backend/src/services/diagram.service.js
// Genera el diagrama ERD en sintaxis Mermaid a partir del script SQL de la BD precargada.
// Usa caché en memoria RAM: el parseo ocurre una sola vez por ciclo de vida del servidor.

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ruta al script SQL de la BD precargada
const SQL_SCRIPT_PATH = resolve(
  __dirname,
  "../../../Docker/db-scripts/02_Chinook_SqlServer.sql"
);
console.log('[diagram.service] Path resuelto:', SQL_SCRIPT_PATH);
// ── Caché en RAM ──────────────────────────────────────────────────────────────
let cachedGlobalDiagram = null;
let cachedGlobalData = null;

function mapSqlType(rawType) {
  if (!rawType) return "string";
  const t = rawType.toUpperCase().split("(")[0].trim();
  if (["INT", "INTEGER", "BIGINT", "SMALLINT", "TINYINT"].includes(t)) return "int";
  if (["NUMERIC", "DECIMAL", "FLOAT", "REAL", "MONEY"].includes(t)) return "float";
  if (["DATE"].includes(t)) return "date";
  if (["DATETIME", "DATETIME2", "TIMESTAMP"].includes(t)) return "datetime";
  if (["BIT", "BOOLEAN"].includes(t)) return "boolean";
  return "string";
}

function splitByComma(str) {
  const parts = [];
  let depth = 0, current = "";
  for (const char of str) {
    if (char === "(") depth++;
    else if (char === ")") depth--;
    if (char === "," && depth === 0) { parts.push(current); current = ""; }
    else current += char;
  }
  if (current.trim()) parts.push(current);
  return parts;
}

/**
 * Parsea el script SQL de la BD y retorna:
 *  - tables:    { TableName: [ { name, type, pk } ] }
 *  - relations: [ { from, to, fromCol, toCol } ]
 *
 * Soporta el patrón Chinook donde los FK vienen en ALTER TABLE separados.
 */
function parseSqlScript(sqlContent) {
  const tables = {};    // { name: [ { name, type, pk } ] }
  const relations = []; // [ { from, to, fromCol, toCol } ]

  // ── 1. Limpiar comentarios de línea y normalizar saltos ───────────────────
  const cleaned = sqlContent
    .replace(/\/\*[\s\S]*?\*\//g, "") // quitar comentarios de bloque: /* ... */
    .replace(/--[^\n]*/g, "")        // quitar comentarios --
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  // ── 2. Dividir en statements por GO o ; ──────────────────────────────────
  // Chinook usa GO como separador de batches
  const statements = cleaned
    .split(/\bGO\b/i)
    .map(s => s.trim())
    .filter(Boolean);

  // ── 3. Procesar cada statement ────────────────────────────────────────────
  for (const stmt of statements) {
    const upper = stmt.toUpperCase();

    // ── CREATE TABLE ──────────────────────────────────────────────────────
    if (/^\s*CREATE\s+TABLE\s+/i.test(stmt)) {
      // Extraer nombre de tabla: [dbo].[Album] → Album
      const tableMatch = stmt.match(
        /CREATE\s+TABLE\s+(?:\[?dbo\]?\.)?\[?(\w+)\]?/i
      );
      if (!tableMatch) continue;

      const tableName = tableMatch[1];
      tables[tableName] = [];

      // Extraer el cuerpo entre los primeros paréntesis balanceados
      const bodyStart = stmt.indexOf("(");
      const bodyEnd = stmt.lastIndexOf(")");
      if (bodyStart === -1 || bodyEnd === -1) continue;

      // const body = stmt.slice(bodyStart + 1, bodyEnd);

      // Dividir por coma respetando paréntesis anidados (para tipos como NUMERIC(10,2))
      // const lines = splitByComma(body);

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const upper2 = trimmed.toUpperCase();

        // Ignorar constraints inline (PRIMARY KEY constraint, UNIQUE...)
        if (/^CONSTRAINT\s+/i.test(trimmed)) {
          // Detectar PRIMARY KEY inline para marcar la columna
          const pkMatch = trimmed.match(
            /CONSTRAINT\s+\[?\w+\]?\s+PRIMARY\s+KEY\s+(?:CLUSTERED|NONCLUSTERED)?\s*\(\s*\[?(\w+)\]?/i
          );
          if (pkMatch) {
            const pkCol = pkMatch[1];
            const col = tables[tableName].find(c => c.name === pkCol);
            if (col) col.pk = true;
          }
          continue;
        }

        // Línea de columna normal: [ColName] TYPE [NOT NULL] ...
        const colMatch = trimmed.match(/^\[?(\w+)\]?\s+(\w+(?:\(\d+(?:,\d+)?\))?)/i);
        if (colMatch) {
          tables[tableName].push({
            name: colMatch[1],
            type: mapSqlType(colMatch[2]),
            pk: false,
            fk: null,
          });
        }
      }
    }

    // ── ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ────────────────────
    if (
      /^\s*ALTER\s+TABLE\s+/i.test(stmt) &&
      /FOREIGN\s+KEY/i.test(stmt)
    ) {
      // FROM table
      const fromMatch = stmt.match(
        /ALTER\s+TABLE\s+(?:\[?dbo\]?\.)?\[?(\w+)\]?/i
      );
      // FROM column
      const fromColMatch = stmt.match(
        /FOREIGN\s+KEY\s*\(\s*\[?(\w+)\]?\s*\)/i
      );
      // TO table + column
      const refMatch = stmt.match(
        /REFERENCES\s+(?:\[?dbo\]?\.)?\[?(\w+)\]?\s*\(\s*\[?(\w+)\]?\s*\)/i
      );

      if (fromMatch && fromColMatch && refMatch) {
        const fromTable = fromMatch[1], fromCol = fromColMatch[1];
        const toTable = refMatch[1], toCol = refMatch[2];
        relations.push({
          from: fromMatch[1],
          to: refMatch[1],
          fromCol: fromColMatch[1],
          toCol: refMatch[2],
        });

        if (tables[fromTable]) {
          const col = tables[fromTable].find(c => c.name === fromCol);
          if (col) col.fk = { table: toTable, column: toCol };
        }
      }
    }
  }

  return { tables, relations };
}

/**
 * Convierte el resultado del parseo a sintaxis Mermaid erDiagram.
 */
function buildMermaidString({ tables, relations }) {
  let diagram = "erDiagram\n";

  for (const [tableName, columns] of Object.entries(tables)) {
    // Columnas que son FK (para marcarlas)
    const fkCols = new Set(
      relations
        .filter(r => r.from === tableName)
        .map(r => r.fromCol)
    );

    diagram += `  ${tableName} {\n`;

    if (columns.length === 0) {
      diagram += `    string id\n`;
    } else {
      for (const col of columns) {
        const pkMark = col.pk ? " PK" : "";
        const fkMark = !col.pk && fkCols.has(col.name) ? " FK" : "";
        diagram += `    ${col.type} ${col.name}${pkMark}${fkMark}\n`;
      }
    }

    diagram += `  }\n`;
  }

  // Relaciones — cardinalidad ||--o{ (uno a muchos, el más común en Chinook)
  for (const rel of relations) {
    // Asegurarse de que ambas tablas están en el diagrama
    if (!tables[rel.from] || !tables[rel.to]) continue;
    const label = `${rel.fromCol}`;
    diagram += `  ${rel.from} }o--|| ${rel.to} : "${label}"\n`;
  }

  return diagram;
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Retorna el diagrama Mermaid de la BD global.
 * Primera llamada: lee el .sql, parsea y cachea.
 * Llamadas siguientes: retorna la caché sin I/O.
 *
 * @returns {string} Diagrama Mermaid listo para renderizar
 */
export function getOrGenerateGlobalDiagram() {
  if (cachedGlobalDiagram && cachedGlobalData) {
    console.log("[diagram.service] Retornando diagrama desde caché.");
    return {
      diagram: cachedGlobalDiagram,
      data: cachedGlobalData
    };
  }

  console.log("[diagram.service] Generando diagrama por primera vez...");

  const sqlContent = readFileSync(SQL_SCRIPT_PATH, "utf-8");
  const parsed = parseSqlScript(sqlContent);

  console.log('[diagram.service] Tablas encontradas:', Object.keys(parsed.tables));

  cachedGlobalData = parsed;
  cachedGlobalDiagram = buildMermaidString(parsed);

  console.log(
    `[diagram.service] Diagrama generado: ${Object.keys(parsed.tables).length} tablas, ` +
    `${parsed.relations.length} relaciones.`
  );

  return {
    diagram: cachedGlobalDiagram,
    data: cachedGlobalData
  };
}

/**
 * Invalida la caché (útil para cuando en el futuro se implementen ALTER TABLE desde bloques).
 */
export function invalidateDiagramCache() {
  cachedGlobalDiagram = null;
  cachedGlobalData = null;
  console.log("[diagram.service] Caché de diagrama invalidada.");
}
