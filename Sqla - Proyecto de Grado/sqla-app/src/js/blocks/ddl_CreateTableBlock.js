

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
export const CREATE_TABLE_GENERATOR = function(block) {
  const tableName = block.getFieldValue('TABLE_NAME');
  
  // 'statementToCode' procesa todos los bloques hijos conectados a "COLUMNS"
  const columns = javascriptGenerator.statementToCode(block, 'COLUMNS');
  
  // Ensamble del código
  const code = `CREATE TABLE ${tableName} (\n${columns.trim()}\n);\n`;
  return code;
};