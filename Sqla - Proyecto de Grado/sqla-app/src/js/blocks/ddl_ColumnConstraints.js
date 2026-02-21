// === CONSTRAINT: NOT NULL ===
export const COLUMN_NOT_NULL_DEFINITION = {
  "type": "sql_column_not_null",
  "message0": "NOT NULL",
  "previousStatement": "ColumnConstraint",
  "nextStatement": "ColumnConstraint",
  "colour": 160,
  "tooltip": "La columna no puede contener valores NULL.",
  "helpUrl": ""
};

export const COLUMN_NOT_NULL_GENERATOR = function(block, generator) {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  const separator = nextBlock ? ' ' : '';
  return `NOT NULL${separator}`;
};

// === CONSTRAINT: DEFAULT ===
export const COLUMN_DEFAULT_DEFINITION = {
  "type": "sql_column_default",
  "message0": "DEFAULT %1",
  "args0": [
    {
      "type": "field_input",
      "name": "DEFAULT_VALUE",
      "text": "0"
    }
  ],
  "previousStatement": "ColumnConstraint",
  "nextStatement": "ColumnConstraint",
  "colour": 160,
  "tooltip": "Valor por defecto para la columna.",
  "helpUrl": ""
};

export const COLUMN_DEFAULT_GENERATOR = function(block, generator) {
  const defaultValue = block.getFieldValue('DEFAULT_VALUE');
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  const separator = nextBlock ? ' ' : '';
  return `DEFAULT ${defaultValue}${separator}`;
};

// === CONSTRAINT: UNIQUE (columna) ===
export const COLUMN_UNIQUE_DEFINITION = {
  "type": "sql_column_unique",
  "message0": "UNIQUE",
  "previousStatement": "ColumnConstraint",
  "nextStatement": "ColumnConstraint",
  "colour": 160,
  "tooltip": "Los valores de esta columna deben ser únicos.",
  "helpUrl": ""
};

export const COLUMN_UNIQUE_GENERATOR = function(block, generator) {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  const separator = nextBlock ? ' ' : '';
  return `UNIQUE${separator}`;
};

// === CONSTRAINT: PRIMARY KEY (columna) ===
export const COLUMN_PRIMARY_KEY_DEFINITION = {
  "type": "sql_column_primary_key",
  "message0": "PRIMARY KEY",
  "previousStatement": "ColumnConstraint",
  "nextStatement": "ColumnConstraint",
  "colour": 160,
  "tooltip": "Define esta columna como clave primaria.",
  "helpUrl": ""
};

export const COLUMN_PRIMARY_KEY_GENERATOR = function(block, generator) {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  const separator = nextBlock ? ' ' : '';
  return `PRIMARY KEY${separator}`;
};

// === CONSTRAINT: REFERENCES (Foreign Key de columna) ===
export const COLUMN_REFERENCES_DEFINITION = {
  "type": "sql_column_references",
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
  "colour": 160,
  "tooltip": "Clave foránea que referencia a otra tabla.",
  "helpUrl": ""
};

export const COLUMN_REFERENCES_GENERATOR = function(block, generator) {
  const refTable = block.getFieldValue('REF_TABLE');
  const refColumn = block.getFieldValue('REF_COLUMN');
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  const separator = nextBlock ? ' ' : '';
  return `REFERENCES ${refTable}(${refColumn})${separator}`;
};

// === CONSTRAINT: CHECK (columna) ===
export const COLUMN_CHECK_DEFINITION = {
  "type": "sql_column_check",
  "message0": "CHECK ( %1 )",
  "args0": [
    {
      "type": "field_input",
      "name": "CHECK_CONDITION",
      "text": "columna > 0"
    }
  ],
  "previousStatement": "ColumnConstraint",
  "nextStatement": "ColumnConstraint",
  "colour": 160,
  "tooltip": "Condición que debe cumplir esta columna.",
  "helpUrl": ""
};

export const COLUMN_CHECK_GENERATOR = function(block, generator) {
  const condition = block.getFieldValue('CHECK_CONDITION');
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  const separator = nextBlock ? ' ' : '';
  return `CHECK (${condition})${separator}`;
};