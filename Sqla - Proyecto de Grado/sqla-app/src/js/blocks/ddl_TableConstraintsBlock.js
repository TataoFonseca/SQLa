// === BLOQUE CONTENEDOR DE TABLE CONSTRAINTS ===
export const TABLE_CONSTRAINTS_DEFINITION = {
  "type": "sql_table_constraints",
  "message0": "TABLE CONSTRAINTS",
  "message1": "%1",
  "args1": [
    {
      "type": "input_statement",
      "name": "CONSTRAINTS",
      "check": "TableConstraint"
    }
  ],
  "previousStatement": "SQL_STATEMENT",
  "nextStatement": "SQL_STATEMENT",
  "colour": 290,
  "tooltip": "Define constraints a nivel de tabla (PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK).",
  "helpUrl": ""
};

// === GENERADOR ===
export const TABLE_CONSTRAINTS_GENERATOR = function(block, generator) {
  // Obtiene el nombre de la tabla del bloque CREATE TABLE anterior
  const previousBlock = block.previousConnection && block.previousConnection.targetBlock();
  let tableName = "mi_tabla"; // Valor por defecto
  
  if (previousBlock && previousBlock.type === 'sql_create_table') {
    tableName = previousBlock.getFieldValue('TABLE_NAME');
  }
  
  // Genera los constraints
  const constraints = generator.statementToCode(block, 'CONSTRAINTS');
  
  if (constraints.trim()) {
    const code = `ALTER TABLE ${tableName} ADD (\n${constraints.trim()}\n);\n`;
    return code;
  }
  
  return '';
};