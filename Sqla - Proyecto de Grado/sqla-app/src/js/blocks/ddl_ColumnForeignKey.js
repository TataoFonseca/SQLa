// === CONSTRAINT: FOREIGN KEY (columna) ===

export const COLUMN_FOREIGN_KEY_DEFINITION = {
  "type": "sql_column_foreign_key",
  "message0": "REFERENCES %1 ( %2 )",
  "args0": [
    {
      "type": "field_input",
      "name": "REF_TABLE",
      "text": "tabla_ref"
    },
    {
      "type": "field_input",
      "name": "REF_COLUMN",
      "text": "id"
    }
  ],
  "previousStatement": "ColumnConstraint",
  "nextStatement": "ColumnConstraint",
  "colour": 290, // Color especial para FK (igual que PK)
  "tooltip": "Clave foránea que referencia otra tabla. El tipo de dato debe coincidir con la columna referenciada.",
  "helpUrl": ""
};

// === GENERADOR ===
export const COLUMN_FOREIGN_KEY_GENERATOR = function(block, generator) {
  const refTable = block.getFieldValue('REF_TABLE');
  const refColumn = block.getFieldValue('REF_COLUMN');
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  const separator = nextBlock ? ' ' : '';
  return `REFERENCES ${refTable}(${refColumn})${separator}`;
};
