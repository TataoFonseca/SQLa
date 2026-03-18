import * as Blockly from 'blockly';
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
export const CREATE_TABLE_GENERATOR = function(block, generator) {
  // const tableName = block.getFieldValue('TABLE_NAME');

  // const columnLines = [];
  // let current = block.getInputTargetBlock('COLUMNS');

  // while (current) {
  //   // Guardamos el siguiente ANTES de procesar
  //   const next = current.getNextBlock();

  //   // Desconectamos temporalmente el next para que blockToCode
  //   // no incluya los bloques siguientes en el output
  //   if (next) current.nextConnection.disconnect();

  //   const code = generator.blockToCode(current);
  //   const line = Array.isArray(code) ? code[0] : code;
  //   if (line && line.trim()) columnLines.push(line.trim());

  //   // Reconectamos
  //   if (next) current.nextConnection.connect(next.previousConnection);

  //   current = next;
  // }

  // const formatted = columnLines
  //   .map((line, i) => i < columnLines.length - 1 ? `  ${line},` : `  ${line}`)
  //   .join('\n');

  // return `CREATE TABLE ${tableName} (\n${formatted}\n);\n`;

  const tableName = block.getFieldValue('TABLE_NAME');

  const columnLines = [];
  let current = block.getInputTargetBlock('COLUMNS');

  while (current) {
    const next = current.getNextBlock();

    if (next) {
      Blockly.Events.disable();
      current.nextConnection.disconnect();
      Blockly.Events.enable();
    }

    const code = generator.blockToCode(current);
    const line = Array.isArray(code) ? code[0] : code;
    if (line && line.trim()) columnLines.push(line.trim());

    if (next) {
      Blockly.Events.disable();
      current.nextConnection.connect(next.previousConnection);
      Blockly.Events.enable();
    }

    current = next;
  }

  const formatted = columnLines
    .map((line, i) => i < columnLines.length - 1 ? `  ${line},` : `  ${line}`)
    .join('\n');

  return `CREATE TABLE ${tableName} (\n${formatted}\n);\n`;

};