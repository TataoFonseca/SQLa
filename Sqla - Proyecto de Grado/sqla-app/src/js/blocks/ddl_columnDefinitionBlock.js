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
      "options": [ // Tipos de datos comunes (sin tamaño para simplificar)
        ["INTEGER", "INTEGER"], //(Tamaño)
        ["FLOAT", "FLOAT"], //(Tamaño)
        // ["TEXT", "TEXT"],
        ["VARCHAR", "VARCHAR"], //(Tamaño)
        ["CHAR", "CHAR"], //(Tamaño)
        ["BOOL", "BOOL"],
        ["DATE", "DATE"], 
        ["DATETIME", "DATETIME"] //(Formato de fecha)
      ]
    }
  ],

  "message1": "constraints %1",
  "args1": [
    {
      "type": "input_statement",
      "name": "CONSTRAINTS",
      "check": "ColumnConstraint"
    }
  ],
  "previousStatement": "ColumnDefinition", // Solo se conecta arriba/abajo con otros
  "nextStatement": "ColumnDefinition",   // ...de su mismo tipo.
  "colour": 210,
  "tooltip": "Define una columna y su tipo de dato.",
  "helpUrl": ""
};

// === GENERADOR (JS) ===
// export const COLUMN_GENERATOR = function(block, generator) {
//   const columnName = block.getFieldValue('COLUMN_NAME');
//   const dataType = block.getFieldValue('DATA_TYPE');
  
//   // Revisa si hay un bloque conectado debajo
//   const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  
//   // Añade una coma si NO es el último bloque de la pila
//   const comma = nextBlock ? ',' : '';
  
//   const code = `  ${columnName} ${dataType}${comma}\n`;
//   return code;
// };

export const COLUMN_GENERATOR = function(block, generator) {
  const columnName = block.getFieldValue('COLUMN_NAME');
  const dataType = block.getFieldValue('DATA_TYPE');

  // Camina la cadena de constraints
  let constraintBlock = block.getInputTargetBlock('CONSTRAINTS');
  const constraintParts = [];
  while (constraintBlock) {
    const code = generator.blockToCode(constraintBlock);
    // blockToCode puede devolver [code, order] si es value block — aquí son statements
    const constraintCode = Array.isArray(code) ? code[0] : code;
    if (constraintCode) constraintParts.push(constraintCode.trim());
    constraintBlock = constraintBlock.getNextBlock();
  }

  const constraints = constraintParts.length > 0 ? ' ' + constraintParts.join(' ') : '';
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  const comma = nextBlock ? ',' : '';

  return `  ${columnName} ${dataType}${constraints}${comma}\n`;
};