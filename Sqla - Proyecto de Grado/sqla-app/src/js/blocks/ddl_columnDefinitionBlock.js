// === DEFINICIÓN (JSON) ===
export const COLUMN_DEFINITION = {
  "type": "sql_column_definition",
  "message0": "columna %1 tipo %2",
  "args0": [
    {
      "type": "field_input",
      "name": "COLUMN_NAME",
      "text": "id"
    },
    {
      "type": "field_dropdown",
      "name": "DATA_TYPE",
      "options": [
        ["TEXT", "TEXT"],
        ["INTEGER", "INTEGER"],
        ["REAL", "REAL"],
        ["NUMERIC", "NUMERIC"],
        ["BLOB", "BLOB"]
      ]
    }
  ],
  "previousStatement": "ColumnDefinition", // Solo se conecta arriba/abajo con otros
  "nextStatement": "ColumnDefinition",   // ...de su mismo tipo.
  "colour": 210,
  "tooltip": "Define una columna y su tipo de dato.",
  "helpUrl": ""
};

// === GENERADOR (JS) ===
export const COLUMN_GENERATOR = function(block) {
  const columnName = block.getFieldValue('COLUMN_NAME');
  const dataType = block.getFieldValue('DATA_TYPE');
  
  // Revisa si hay un bloque conectado debajo
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  
  // Añade una coma si NO es el último bloque de la pila
  const comma = nextBlock ? ',' : '';
  
  const code = `  ${columnName} ${dataType}${comma}\n`;
  return code;
};