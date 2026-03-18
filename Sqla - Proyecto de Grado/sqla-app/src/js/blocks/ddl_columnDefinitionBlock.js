// // === DEFINICIÓN (JSON) ===
// export const COLUMN_DEFINITION = {
//   "type": "sql_column_definition",
//   "message0": "columna %1 tipo %2",
//   "args0": [
//     {
//       "type": "field_input",
//       "name": "COLUMN_NAME",
//       "text": "id"
//     },
//     {
//       "type": "field_dropdown",
//       "name": "DATA_TYPE",
//       "options": [ // Tipos de datos comunes (sin tamaño para simplificar)
//         ["INTEGER", "INTEGER"], //(Tamaño)
//         ["FLOAT", "FLOAT"], //(Tamaño)
//         // ["TEXT", "TEXT"],
//         ["VARCHAR", "VARCHAR"], //(Tamaño)
//         ["CHAR", "CHAR"], //(Tamaño)
//         ["BOOL", "BOOL"],
//         ["DATE", "DATE"], 
//         ["DATETIME", "DATETIME"] //(Formato de fecha)
//       ]
//     }
//   ],
//   "previousStatement": "ColumnDefinition", // Solo se conecta arriba/abajo con otros
//   "nextStatement": "ColumnDefinition",   // ...de su mismo tipo.
//   "colour": 210,
//   "tooltip": "Define una columna y su tipo de dato.",
//   "helpUrl": "",
//   "extensions": ["column_definition_context_menu"]
// };

// // === GENERADOR (JS) ===
// export const COLUMN_GENERATOR = function(block, generator) {
//   // const columnName = block.getFieldValue('COLUMN_NAME');
//   // const dataType = block.getFieldValue('DATA_TYPE');

//   // // Camina la cadena de constraints
//   // let constraintBlock = block.getInputTargetBlock('CONSTRAINTS');
//   // const constraintParts = [];
//   // while (constraintBlock) {
//   //   const code = generator.blockToCode(constraintBlock);
//   //   // blockToCode puede devolver [code, order] si es value block — aquí son statements
//   //   const constraintCode = Array.isArray(code) ? code[0] : code;
//   //   if (constraintCode) constraintParts.push(constraintCode.trim());
//   //   constraintBlock = constraintBlock.getNextBlock();
//   // }

//   // const constraints = constraintParts.length > 0 ? ' ' + constraintParts.join(' ') : '';
//   // const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
//   // const comma = nextBlock ? ',' : '';

//   // return `  ${columnName} ${dataType}${constraints}${comma}\n`;

//    const columnName = block.getFieldValue('COLUMN_NAME');
//   const dataType   = block.getFieldValue('DATA_TYPE');

//   const parts = [];

//   if (block.getInput('C_IDENTITY')) {
//     const seed      = block.getFieldValue('IDENTITY_SEED')      || '1';
//     const increment = block.getFieldValue('IDENTITY_INCREMENT') || '1';
//     parts.push(`IDENTITY(${seed},${increment})`);
//   }
//   if (block.getInput('C_NOT_NULL'))   parts.push('NOT NULL');
//   if (block.getInput('C_UNIQUE'))     parts.push('UNIQUE');
//   if (block.getInput('C_DEFAULT')) {
//     const val = block.getFieldValue('DEFAULT_VALUE') || '0';
//     parts.push(`DEFAULT ${val}`);
//   }
//   if (block.getInput('C_CHECK')) {
//     const cond = block.getFieldValue('CHECK_CONDITION') || 'columna > 0';
//     parts.push(`CHECK (${cond})`);
//   }
//   if (block.getInput('C_REFERENCES')) {
//     const refTable  = block.getFieldValue('REF_TABLE')  || 'tabla_ref';
//     const refColumn = block.getFieldValue('REF_COLUMN') || 'id';
//     parts.push(`REFERENCES ${refTable}(${refColumn})`);
//   }

//   const constraints = parts.length > 0 ? ' ' + parts.join(' ') : '';
//   return `${columnName} ${dataType}${constraints}`;
// };


export const COLUMN_DEFINITION = {
  type: 'sql_column_definition'
};

export function columnDefinitionBlockInit(Blockly) {
  return {
    init: function() {
      this.appendValueInput('FIRST_CONSTRAINT')
        .setCheck('ColumnConstraint')
        .appendField('columna')
        .appendField(new Blockly.FieldTextInput('id'), 'COLUMN_NAME')
        .appendField('tipo')
        .appendField(new Blockly.FieldDropdown([
          ['INTEGER',  'INTEGER'], //(Tamaño)
          ['FLOAT',    'FLOAT'], //(Tamaño)
          ['VARCHAR',  'VARCHAR'], //(Tamaño)
          ['CHAR',     'CHAR'], //(Tamaño)
          ['BOOL',     'BOOL'],
          ['DATE',     'DATE'],
          ['DATETIME', 'DATETIME']
        ]), 'DATA_TYPE');

      this.setInputsInline(false);
      this.setPreviousStatement(true, 'ColumnDefinition');
      this.setNextStatement(true, 'ColumnDefinition');
      this.setColour(210);
      this.setTooltip('Define una columna y su tipo de dato.');
      this.setHelpUrl('');

      //Soporte a menú contextual para convertir a PRIMARY KEY
      Blockly.Extensions.apply('column_to_pk_context_menu', this, false);
    }
  };
}

export const COLUMN_GENERATOR = function(block, generator) {
  // const columnName = block.getFieldValue('COLUMN_NAME');
  // const dataType   = block.getFieldValue('DATA_TYPE');

  // const constraintParts = [];
  // let current = block.getInputTargetBlock('FIRST_CONSTRAINT');
  // while (current) {
  //   const code = generator.blockToCode(current);
  //   const constraintCode = Array.isArray(code) ? code[0] : code;
  //   if (constraintCode) constraintParts.push(constraintCode.trim());
  //   current = current.getInputTargetBlock('NEXT_CONSTRAINT');
  // }

  // const constraints = constraintParts.length > 0 ? ' ' + constraintParts.join(' ') : '';
  // return `${columnName} ${dataType}${constraints}`;

  const columnName = block.getFieldValue('COLUMN_NAME');
  const dataType   = block.getFieldValue('DATA_TYPE');

  const constraintParts = [];
  let current = block.getInputTargetBlock('FIRST_CONSTRAINT');
  while (current) {
    const code = generator.blockToCode(current);
    const constraintCode = Array.isArray(code) ? code[0] : code;
    if (constraintCode) constraintParts.push(constraintCode.trim());
    current = current.getInputTargetBlock('NEXT_CONSTRAINT');
  }

  const constraints = constraintParts.length > 0 ? ' ' + constraintParts.join(' ') : '';
  return `${columnName} ${dataType}${constraints}`;
};