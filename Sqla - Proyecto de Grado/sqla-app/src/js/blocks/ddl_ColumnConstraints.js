// // === CONSTRAINT: NOT NULL ===
// export const COLUMN_NOT_NULL_DEFINITION = {
//   "type": "sql_column_not_null",
//   "message0": "NOT NULL",
//   "previousStatement": "ColumnConstraint",
//   "nextStatement": "ColumnConstraint",
//   "colour": 160,
//   "tooltip": "La columna no puede contener valores NULL.",
//   "helpUrl": ""
// };

// export const COLUMN_NOT_NULL_GENERATOR = function(block, generator) {
//   const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
//   const separator = nextBlock ? ' ' : '';
//   return `NOT NULL${separator}`;
// };

// // === CONSTRAINT: DEFAULT ===
// export const COLUMN_DEFAULT_DEFINITION = {
//   "type": "sql_column_default",
//   "message0": "DEFAULT %1",
//   "args0": [
//     {
//       "type": "field_input",
//       "name": "DEFAULT_VALUE",
//       "text": "0"
//     }
//   ],
//   "previousStatement": "ColumnConstraint",
//   "nextStatement": "ColumnConstraint",
//   "colour": 160,
//   "tooltip": "Valor por defecto para la columna.",
//   "helpUrl": ""
// };

// export const COLUMN_DEFAULT_GENERATOR = function(block, generator) {
//   const defaultValue = block.getFieldValue('DEFAULT_VALUE');
//   const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
//   const separator = nextBlock ? ' ' : '';
//   return `DEFAULT ${defaultValue}${separator}`;
// };

// // === CONSTRAINT: UNIQUE (columna) ===
// export const COLUMN_UNIQUE_DEFINITION = {
//   "type": "sql_column_unique",
//   "message0": "UNIQUE",
//   "previousStatement": "ColumnConstraint",
//   "nextStatement": "ColumnConstraint",
//   "colour": 160,
//   "tooltip": "Los valores de esta columna deben ser únicos.",
//   "helpUrl": ""
// };

// export const COLUMN_UNIQUE_GENERATOR = function(block, generator) {
//   const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
//   const separator = nextBlock ? ' ' : '';
//   return `UNIQUE${separator}`;
// };

// // === CONSTRAINT: PRIMARY KEY (columna) ===
// export const COLUMN_PRIMARY_KEY_DEFINITION = {
//   "type": "sql_column_primary_key",
//   "message0": "PRIMARY KEY",
//   "previousStatement": "ColumnConstraint",
//   "nextStatement": "ColumnConstraint",
//   "colour": 160,
//   "tooltip": "Define esta columna como clave primaria.",
//   "helpUrl": ""
// };

// export const COLUMN_PRIMARY_KEY_GENERATOR = function(block, generator) {
//   const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
//   const separator = nextBlock ? ' ' : '';
//   return `PRIMARY KEY${separator}`;
// };

// // === CONSTRAINT: REFERENCES (Foreign Key de columna) ===
// export const COLUMN_REFERENCES_DEFINITION = {
//   "type": "sql_column_references",
//   "message0": "REFERENCES %1 ( %2 )",
//   "args0": [
//     {
//       "type": "field_input",
//       "name": "REF_TABLE",
//       "text": "tabla_ref"
//     },
//     {
//       "type": "field_input",
//       "name": "REF_COLUMN",
//       "text": "id"
//     }
//   ],
//   "previousStatement": "ColumnConstraint",
//   "nextStatement": "ColumnConstraint",
//   "colour": 160,
//   "tooltip": "Clave foránea que referencia a otra tabla.",
//   "helpUrl": ""
// };

// export const COLUMN_REFERENCES_GENERATOR = function(block, generator) {
//   const refTable = block.getFieldValue('REF_TABLE');
//   const refColumn = block.getFieldValue('REF_COLUMN');
//   const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
//   const separator = nextBlock ? ' ' : '';
//   return `REFERENCES ${refTable}(${refColumn})${separator}`;
// };

// // === CONSTRAINT: CHECK (columna) ===
// export const COLUMN_CHECK_DEFINITION = {
//   "type": "sql_column_check",
//   "message0": "CHECK ( %1 )",
//   "args0": [
//     {
//       "type": "field_input",
//       "name": "CHECK_CONDITION",
//       "text": "columna > 0"
//     }
//   ],
//   "previousStatement": "ColumnConstraint",
//   "nextStatement": "ColumnConstraint",
//   "colour": 160,
//   "tooltip": "Condición que debe cumplir esta columna.",
//   "helpUrl": ""
// };

// export const COLUMN_CHECK_GENERATOR = function(block, generator) {
//   const condition = block.getFieldValue('CHECK_CONDITION');
//   const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
//   const separator = nextBlock ? ' ' : '';
//   return `CHECK (${condition})${separator}`;
// };



// === CONSTRAINT: NOT NULL ===
// Tipos numéricos/enteros compatibles con IDENTITY
const IDENTITY_COMPATIBLE_TYPES = ['INTEGER', 'FLOAT'];

// Helper: obtiene el bloque columna padre (sql_column_definition)
function getParentColumnBlock(block) {
  let parent = block.getSurroundParent();
  while (parent) {
    if (parent.type === 'sql_column_definition') return parent;
    parent = parent.getSurroundParent();
  }
  return null;
}

// Helper: obtiene todos los tipos de constraint actualmente en la columna (excepto el bloque actual)
function getSiblingConstraintTypes(block) {
  const parent = getParentColumnBlock(block);
  if (!parent) return [];

  let current = parent.getInputTargetBlock('CONSTRAINTS');
  const types = [];
  while (current) {
    if (current.id !== block.id) types.push(current.type);
    current = current.getNextBlock();
  }
  return types;
}

// ─────────────────────────────────────────────
// IDENTITY
// ─────────────────────────────────────────────
export const COLUMN_IDENTITY_DEFINITION = {
  "type": "sql_column_identity",
  "message0": "IDENTITY ( %1 , %2 )",
  "args0": [
    { "type": "field_number", "name": "SEED", "value": 1, "precision": 1 },
    { "type": "field_number", "name": "INCREMENT", "value": 1, "precision": 1 }
  ],
  "previousStatement": "ColumnConstraint",
  "nextStatement": "ColumnConstraint",
  "colour": 160,
  "tooltip": "Auto-incremento. Solo válido para tipos numéricos enteros.",
  "helpUrl": ""
};

export const COLUMN_IDENTITY_GENERATOR = function(block, generator) {
  const seed = block.getFieldValue('SEED');
  const increment = block.getFieldValue('INCREMENT');
  return `IDENTITY(${seed},${increment})`;
};

// onchange: deshabilitar si el tipo de dato del padre no es numérico
export const COLUMN_IDENTITY_ONCHANGE = function(event) {
  const block = this;
  if (block.isInFlyout) return;

  const parent = getParentColumnBlock(block);
  if (!parent) return;

  const dataType = parent.getFieldValue('DATA_TYPE');
  const isCompatible = IDENTITY_COMPATIBLE_TYPES.includes(dataType);

  if (!isCompatible) {
    block.setWarningText('IDENTITY solo es compatible con tipos numéricos (INTEGER, FLOAT).');
    block.setEnabled(false);
  } else {
    block.setWarningText(null);
    block.setEnabled(true);
  }
};

// ─────────────────────────────────────────────
// NOT NULL
// ─────────────────────────────────────────────
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
  return `NOT NULL`;
};

export const COLUMN_NOT_NULL_ONCHANGE = function(event) {
  const block = this;
  if (block.isInFlyout) return;

  const siblings = getSiblingConstraintTypes(block);
  if (siblings.includes('sql_column_not_null')) {
    block.setWarningText('NOT NULL ya está definido en esta columna.');
    block.setEnabled(false);
  } else {
    block.setWarningText(null);
    block.setEnabled(true);
  }
};

// ─────────────────────────────────────────────
// UNIQUE
// ─────────────────────────────────────────────
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
  return `UNIQUE`;
};

export const COLUMN_UNIQUE_ONCHANGE = function(event) {
  const block = this;
  if (block.isInFlyout) return;

  const siblings = getSiblingConstraintTypes(block);

  if (siblings.includes('sql_column_unique')) {
    block.setWarningText('UNIQUE ya está definido en esta columna.');
    block.setEnabled(false);
    return;
  }

  // Si hay UNIQUE, deshabilitar cualquier DEFAULT que exista en la misma columna
  const parent = getParentColumnBlock(block);
  if (parent) {
    let current = parent.getInputTargetBlock('CONSTRAINTS');
    while (current) {
      if (current.type === 'sql_column_default') {
        current.setWarningText('DEFAULT no es compatible con UNIQUE.');
        current.setEnabled(false);
      }
      current = current.getNextBlock();
    }
  }

  block.setWarningText(null);
  block.setEnabled(true);
};

// ─────────────────────────────────────────────
// DEFAULT
// ─────────────────────────────────────────────
export const COLUMN_DEFAULT_DEFINITION = {
  "type": "sql_column_default",
  "message0": "DEFAULT %1",
  "args0": [
    { "type": "field_input", "name": "DEFAULT_VALUE", "text": "0" }
  ],
  "previousStatement": "ColumnConstraint",
  "nextStatement": "ColumnConstraint",
  "colour": 160,
  "tooltip": "Valor por defecto para la columna.",
  "helpUrl": ""
};

export const COLUMN_DEFAULT_GENERATOR = function(block, generator) {
  const defaultValue = block.getFieldValue('DEFAULT_VALUE');
  return `DEFAULT ${defaultValue}`;
};

export const COLUMN_DEFAULT_ONCHANGE = function(event) {
  const block = this;
  if (block.isInFlyout) return;

  const siblings = getSiblingConstraintTypes(block);

  if (siblings.includes('sql_column_default')) {
    block.setWarningText('DEFAULT ya está definido en esta columna.');
    block.setEnabled(false);
    return;
  }

  if (siblings.includes('sql_column_unique')) {
    block.setWarningText('DEFAULT no es compatible con UNIQUE.');
    block.setEnabled(false);
    return;
  }

  block.setWarningText(null);
  block.setEnabled(true);
};

// ─────────────────────────────────────────────
// CHECK
// ─────────────────────────────────────────────
export const COLUMN_CHECK_DEFINITION = {
  "type": "sql_column_check",
  "message0": "CHECK ( %1 )",
  "args0": [
    { "type": "field_input", "name": "CHECK_CONDITION", "text": "columna > 0" }
  ],
  "previousStatement": "ColumnConstraint",
  "nextStatement": "ColumnConstraint",
  "colour": 160,
  "tooltip": "Condición que debe cumplir esta columna.",
  "helpUrl": ""
};

export const COLUMN_CHECK_GENERATOR = function(block, generator) {
  const condition = block.getFieldValue('CHECK_CONDITION');
  return `CHECK (${condition})`;
};

export const COLUMN_CHECK_ONCHANGE = function(event) {
  const block = this;
  if (block.isInFlyout) return;

  const siblings = getSiblingConstraintTypes(block);
  if (siblings.includes('sql_column_check')) {
    block.setWarningText('CHECK ya está definido en esta columna.');
    block.setEnabled(false);
  } else {
    block.setWarningText(null);
    block.setEnabled(true);
  }
};

// REFERENCES — sin reglas adicionales por ahora más allá de no repetir
export const COLUMN_REFERENCES_DEFINITION = {
  "type": "sql_column_references",
  "message0": "REFERENCES %1 ( %2 )",
  "args0": [
    { "type": "field_input", "name": "REF_TABLE", "text": "tabla_ref" },
    { "type": "field_input", "name": "REF_COLUMN", "text": "id" }
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
  return `REFERENCES ${refTable}(${refColumn})`;
};

export const COLUMN_REFERENCES_ONCHANGE = function(event) {
  const block = this;
  if (block.isInFlyout) return;

  const siblings = getSiblingConstraintTypes(block);
  if (siblings.includes('sql_column_references')) {
    block.setWarningText('REFERENCES ya está definido en esta columna.');
    block.setEnabled(false);
  } else {
    block.setWarningText(null);
    block.setEnabled(true);
  }
};