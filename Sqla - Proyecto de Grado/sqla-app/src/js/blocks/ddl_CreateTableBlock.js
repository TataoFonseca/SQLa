

export const CREATE_TABLE_DEFINITION = {
  "type": "sql_create_table",
  "message0": "CREATE TABLE %1",
  "args0": [
    {
      "type": "field_input",
      "name": "TABLE_NAME",
      "text": "mi_tabla"
    }
  ],
  "message1": "COLUMNAS %1", // La "boca"
  "args1": [
    {
      "type": "input_statement",
      "name": "COLUMNS",
      "check": "ColumnDefinition" // Solo acepta bloques de tipo "ColumnDefinition"
    }
  ],
  "inputsInline": false,
  "previousStatement": "SQL_STATEMENT",
  "nextStatement": "SQL_STATEMENT",
  "colour": 230, // Un color diferente para DDL
  "tooltip": "Crea una nueva tabla con las columnas especificadas.",
  "helpUrl": ""
};

// === GENERADOR (JS) ===
// export const CREATE_TABLE_GENERATOR = function(block, generator) {
//   const tableName = block.getFieldValue('TABLE_NAME');
//   const columnLines = [];

//   // Primer bloque del statement input COLUMNS
//   let current = block.getInputTargetBlock('COLUMNS');

//   while (current) {
//     // Solo procesamos bloques columna — los constraints los recoge el propio COLUMN_GENERATOR
//     if (current.type === 'sql_column_definition' || current.type === 'sql_column_primary_key') {
//       const code = generator.blockToCode(current);
//       const line = Array.isArray(code) ? code[0] : code;
//       if (line) columnLines.push(line.trim());
//     }

//     // Avanza al siguiente bloque — salta constraints hasta encontrar la próxima columna
//     let next = current.nextConnection && current.nextConnection.targetBlock();
//     while (next && next.type !== 'sql_column_definition' && next.type !== 'sql_column_primary_key') {
//       next = next.nextConnection && next.nextConnection.targetBlock();
//     }
//     current = next;
//   }

//   const columns = columnLines.map((line, i) =>
//     i < columnLines.length - 1 ? `  ${line},` : `  ${line}`
//   ).join('\n');

//   return `CREATE TABLE ${tableName} (\n${columns}\n);\n`;
// };

// export const CREATE_TABLE_GENERATOR = function(block, generator) {
//   const tableName = block.getFieldValue('TABLE_NAME');

//   const columnLines = [];
//   let current = block.getInputTargetBlock('COLUMNS');

//   while (current) {
//     const code = generator.blockToCode(current);
//     const line = Array.isArray(code) ? code[0] : code;
//     if (line) columnLines.push(line.trim());
//     current = current.getNextBlock();
//   }

//   const columns = columnLines.map((line, i) =>
//     i < columnLines.length - 1 ? `  ${line},` : `  ${line}`
//   ).join('\n');

//   return `CREATE TABLE ${tableName} (\n${columns}\n);\n`;
// };

export const CREATE_TABLE_GENERATOR = function(block, generator) {
  const tableName = block.getFieldValue('TABLE_NAME');
  const columns   = generator.statementToCode(block, 'COLUMNS');

  const lines = columns
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const formatted = lines.map((line, i) =>
    i < lines.length - 1 ? `  ${line},` : `  ${line}`
  ).join('\n');

  return `CREATE TABLE ${tableName} (\n${formatted}\n);\n`;
};