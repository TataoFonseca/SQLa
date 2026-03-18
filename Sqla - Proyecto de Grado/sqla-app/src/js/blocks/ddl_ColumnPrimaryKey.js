// === CONSTRAINT: PRIMARY KEY (columna) ===
// Este bloque incluye NOT NULL implícito (PRIMARY KEY siempre es NOT NULL)

// export const COLUMN_PRIMARY_KEY_DEFINITION = {
//   "type": "sql_column_primary_key",
//   "message0": "NOT NULL PRIMARY KEY",
//   "previousStatement": "ColumnConstraint",
//   "nextStatement": "ColumnConstraint",
//   "colour": 290, // Color especial para PRIMARY KEY
//   "tooltip": "Define esta columna como clave primaria. Solo puede haber UNA en toda la tabla. PRIMARY KEY implica NOT NULL automáticamente.",
//   "helpUrl": ""
// };

// // === GENERADOR ===
// export const COLUMN_PRIMARY_KEY_GENERATOR = function(block, generator) {
//   const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
//   const separator = nextBlock ? ' ' : '';
  
//   // PRIMARY KEY ya implica NOT NULL, no necesitamos escribirlo
//   // Pero lo mostramos en el bloque para que sea educativo
//   return `PRIMARY KEY${separator}`;
// };

export function columnPrimaryKeyBlockInit(Blockly) {
  return {
    init: function() {
      this.appendDummyInput()
        .appendField('columna')
        .appendField(new Blockly.FieldTextInput('id'), 'COLUMN_NAME')
        .appendField('tipo')
        .appendField(new Blockly.FieldDropdown([
          ['INTEGER',  'INTEGER'],
          ['FLOAT',    'FLOAT'],
          ['VARCHAR',  'VARCHAR'],
          ['CHAR',     'CHAR'],
          ['BOOL',     'BOOL'],
          ['DATE',     'DATE'],
          ['DATETIME', 'DATETIME']
        ]), 'DATA_TYPE')
        .appendField('NOT NULL PRIMARY KEY');

      this.setInputsInline(false);
      this.setPreviousStatement(true, 'ColumnDefinition');
      this.setNextStatement(true, 'ColumnDefinition');
      this.setColour(290);
      this.setTooltip('Columna Primary Key. NOT NULL está implícito.');
      this.setHelpUrl('');

      Blockly.Extensions.apply('pk_to_column_context_menu', this, false);
    }
  };
}

export const COLUMN_PRIMARY_KEY_GENERATOR = function(block, generator) {
  const columnName = block.getFieldValue('COLUMN_NAME');
  const dataType   = block.getFieldValue('DATA_TYPE');
  return `${columnName} ${dataType} NOT NULL PRIMARY KEY`;
};