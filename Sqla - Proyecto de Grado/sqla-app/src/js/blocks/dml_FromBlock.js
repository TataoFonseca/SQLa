// sqla-app/src/js/blocks/fromBlock.js
// SOLO EXPORTA: La forma (JSON) y el generador (función)

export const FROM_DEFINITION = {
  "type": "sql_from",
  "message0": "FROM %1 %2",
  "args0": [
    {
      "type": "field_input",
      "name": "TABLE_NAME",
      "text": "mi_tabla"
    },
    {
      // Input tipo STATEMENT: la "boquilla" abierta donde entran los JOIN blocks
      "type": "input_statement",
      "name": "JOINS",
      "check": "SQL_JOIN"   // Solo acepta bloques cuyo previousStatement sea "SQL_JOIN"
    }
  ],
  "previousStatement": "SQL_STATEMENT",
  "nextStatement": "SQL_STATEMENT",
  "colour": 160,
  "tooltip": "Especifica la tabla de origen.",
  "helpUrl": "",
  "extensions": ["from_joins_context_menu"]
};

export const FROM_GENERATOR = function (block, generator) {
  const tableName = block.getFieldValue('TABLE_NAME');
  // Genera el código de todos los JOINs encadenados dentro de la boquilla
  const joinsCode = generator.statementToCode(block, 'JOINS');

  // joinsCode ya viene con indentación por defecto de Blockly; la limpiamos
  const joinsTrimmed = joinsCode
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

  let code = 'FROM ' + tableName;
  if (joinsTrimmed) {
    code += '\n' + joinsTrimmed;
  }

  // const code = 'FROM ' + tableName + '\n';
  code += '\n';

  return code;
};