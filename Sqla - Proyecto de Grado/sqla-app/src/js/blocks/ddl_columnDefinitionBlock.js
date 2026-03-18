//=== DEFINICIÓN (JSON) ===
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

  // valueToCode resuelve toda la cadena recursivamente via NEXT_CONSTRAINT
  const constraints = generator.valueToCode(block, 'FIRST_CONSTRAINT', 0);

  return `${columnName} ${dataType}${constraints ? ' ' + constraints : ''}`;
};