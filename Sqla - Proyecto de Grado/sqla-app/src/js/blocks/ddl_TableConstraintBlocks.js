// === CONSTRAINT: PRIMARY KEY (tabla - puede ser compuesta) ===
export const TABLE_PRIMARY_KEY_DEFINITION = {
  "type": "sql_table_primary_key",
  "message0": "PRIMARY KEY ( %1 )",
  "args0": [
    {
      "type": "field_input",
      "name": "COLUMNS",
      "text": "columna1, columna2"
    }
  ],
  "previousStatement": "TableConstraint",
  "nextStatement": "TableConstraint",
  "colour": 290,
  "tooltip": "Define la clave primaria de la tabla (puede ser compuesta).",
  "helpUrl": ""
};

export const TABLE_PRIMARY_KEY_GENERATOR = function(block, generator) {
  const columns = block.getFieldValue('COLUMNS');
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  const comma = nextBlock ? ',' : '';
  return `  PRIMARY KEY (${columns})${comma}\n`;
};

// === CONSTRAINT: FOREIGN KEY (tabla - puede ser compuesta) ===
export const TABLE_FOREIGN_KEY_DEFINITION = {
  "type": "sql_table_foreign_key",
  "message0": "FOREIGN KEY ( %1 ) REFERENCES %2 ( %3 )",
  "args0": [
    {
      "type": "field_input",
      "name": "COLUMNS",
      "text": "columna1"
    },
    {
      "type": "field_input",
      "name": "REF_TABLE",
      "text": "tabla_ref"
    },
    {
      "type": "field_input",
      "name": "REF_COLUMNS",
      "text": "id"
    }
  ],
  "previousStatement": "TableConstraint",
  "nextStatement": "TableConstraint",
  "colour": 290,
  "tooltip": "Clave foránea a nivel de tabla (puede incluir múltiples columnas).",
  "helpUrl": ""
};

export const TABLE_FOREIGN_KEY_GENERATOR = function(block, generator) {
  const columns = block.getFieldValue('COLUMNS');
  const refTable = block.getFieldValue('REF_TABLE');
  const refColumns = block.getFieldValue('REF_COLUMNS');
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  const comma = nextBlock ? ',' : '';
  return `  FOREIGN KEY (${columns}) REFERENCES ${refTable}(${refColumns})${comma}\n`;
};

// === CONSTRAINT: UNIQUE (tabla - para combinaciones) ===
export const TABLE_UNIQUE_DEFINITION = {
  "type": "sql_table_unique",
  "message0": "UNIQUE ( %1 )",
  "args0": [
    {
      "type": "field_input",
      "name": "COLUMNS",
      "text": "columna1, columna2"
    }
  ],
  "previousStatement": "TableConstraint",
  "nextStatement": "TableConstraint",
  "colour": 290,
  "tooltip": "Combinación única de columnas.",
  "helpUrl": ""
};

export const TABLE_UNIQUE_GENERATOR = function(block, generator) {
  const columns = block.getFieldValue('COLUMNS');
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  const comma = nextBlock ? ',' : '';
  return `  UNIQUE (${columns})${comma}\n`;
};

// === CONSTRAINT: CHECK (tabla - puede usar varias columnas) ===
export const TABLE_CHECK_DEFINITION = {
  "type": "sql_table_check",
  "message0": "CHECK ( %1 )",
  "args0": [
    {
      "type": "field_input",
      "name": "CHECK_CONDITION",
      "text": "columna1 > columna2"
    }
  ],
  "previousStatement": "TableConstraint",
  "nextStatement": "TableConstraint",
  "colour": 290,
  "tooltip": "Condición que debe cumplir la tabla (puede involucrar varias columnas).",
  "helpUrl": ""
};

export const TABLE_CHECK_GENERATOR = function(block, generator) {
  const condition = block.getFieldValue('CHECK_CONDITION');
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  const comma = nextBlock ? ',' : '';
  return `  CHECK (${condition})${comma}\n`;
};