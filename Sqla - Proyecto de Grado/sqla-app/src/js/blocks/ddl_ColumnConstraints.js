// // // // === CONSTRAINT: NOT NULL ===

// // const IDENTITY_COMPATIBLE_TYPES = ['INTEGER', 'FLOAT'];

// // // Helper: sube por el árbol hasta encontrar el sql_column_definition padre
// // function getParentColumnBlock(block) {
// //   let current = block;
// //   while (current) {
// //     if (current.type === 'sql_column_definition') return current;
// //     // Sube via previousConnection (bloques encadenados)
// //     const prev = current.previousConnection && current.previousConnection.targetBlock();
// //     if (prev) {
// //       current = prev;
// //     } else {
// //       // Sube via getSurroundParent por si acaso
// //       current = current.getSurroundParent ? current.getSurroundParent() : null;
// //     }
// //   }
// //   return null;
// // }

// // // Helper: obtiene los tipos de constraint encadenados en la misma columna (excepto el bloque actual)
// // function getSiblingConstraintTypes(block) {
// //   const parent = getParentColumnBlock(block);
// //   if (!parent) return [];

// //   const types = [];
// //   let current = parent.nextConnection && parent.nextConnection.targetBlock();
// //   while (current && current.type !== 'sql_column_definition' && current.type !== 'sql_column_primary_key') {
// //     if (current.id !== block.id) types.push(current.type);
// //     current = current.nextConnection && current.nextConnection.targetBlock();
// //   }
// //   return types;
// // }

// // // ─────────────────────────────────────────────
// // // IDENTITY
// // // ─────────────────────────────────────────────
// // export const COLUMN_IDENTITY_DEFINITION = {
// //   "type": "sql_column_identity",
// //   "message0": "IDENTITY ( %1 , %2 )",
// //   "args0": [
// //     { "type": "field_number", "name": "SEED",      "value": 1, "precision": 1 },
// //     { "type": "field_number", "name": "INCREMENT", "value": 1, "precision": 1 }
// //   ],
// //   "previousStatement": ["ColumnDefinition", "ColumnConstraint"],
// //   "nextStatement":     ["ColumnConstraint", "ColumnDefinition"],
// //   "colour": 160,
// //   "tooltip": "Auto-incremento. Solo válido para tipos numéricos enteros.",
// //   "helpUrl": ""
// // };

// // export const COLUMN_IDENTITY_GENERATOR = function(block, generator) {
// //   const seed      = block.getFieldValue('SEED');
// //   const increment = block.getFieldValue('INCREMENT');
// //   return `IDENTITY(${seed},${increment})`;
// // };

// // export const COLUMN_IDENTITY_ONCHANGE = function(event) {
// //   if (event.type !== 'block_move' && event.type !== 'block_change') return;
// //   const block = this;
// //   if (block.isInFlyout) return;

// //   const parent = getParentColumnBlock(block);
// //   if (!parent) return;

// //   const dataType     = parent.getFieldValue('DATA_TYPE');
// //   const isCompatible = IDENTITY_COMPATIBLE_TYPES.includes(dataType);

// //   if (!isCompatible) {
// //     block.setWarningText('IDENTITY solo es compatible con tipos numéricos (INTEGER, FLOAT).');
// //     block.setEnabled(false);
// //   } else {
// //     block.setWarningText(null);
// //     block.setEnabled(true);
// //   }
// // };

// // // ─────────────────────────────────────────────
// // // NOT NULL
// // // ─────────────────────────────────────────────
// // export const COLUMN_NOT_NULL_DEFINITION = {
// //   "type": "sql_column_not_null",
// //   "message0": "NOT NULL",
// //   "previousStatement": ["ColumnDefinition", "ColumnConstraint"],
// //   "nextStatement":     ["ColumnConstraint", "ColumnDefinition"],
// //   "colour": 160,
// //   "tooltip": "La columna no puede contener valores NULL.",
// //   "helpUrl": ""
// // };

// // export const COLUMN_NOT_NULL_GENERATOR = function(block, generator) {
// //   return `NOT NULL`;
// // };

// // export const COLUMN_NOT_NULL_ONCHANGE = function(event) {
// //   if (event.type !== 'block_move' && event.type !== 'block_change') return;
// //   const block = this;
// //   if (block.isInFlyout) return;

// //   const siblings = getSiblingConstraintTypes(block);
// //   if (siblings.includes('sql_column_not_null')) {
// //     block.setWarningText('NOT NULL ya está definido en esta columna.');
// //     block.setEnabled(false);
// //   } else {
// //     block.setWarningText(null);
// //     block.setEnabled(true);
// //   }
// // };

// // // ─────────────────────────────────────────────
// // // UNIQUE
// // // ─────────────────────────────────────────────
// // export const COLUMN_UNIQUE_DEFINITION = {
// //   "type": "sql_column_unique",
// //   "message0": "UNIQUE",
// //   "previousStatement": ["ColumnDefinition", "ColumnConstraint"],
// //   "nextStatement":     ["ColumnConstraint", "ColumnDefinition"],
// //   "colour": 160,
// //   "tooltip": "Los valores de esta columna deben ser únicos.",
// //   "helpUrl": ""
// // };

// // export const COLUMN_UNIQUE_GENERATOR = function(block, generator) {
// //   return `UNIQUE`;
// // };

// // export const COLUMN_UNIQUE_ONCHANGE = function(event) {
// //   if (event.type !== 'block_move' && event.type !== 'block_change') return;
// //   const block = this;
// //   if (block.isInFlyout) return;

// //   const siblings = getSiblingConstraintTypes(block);

// //   if (siblings.includes('sql_column_unique')) {
// //     block.setWarningText('UNIQUE ya está definido en esta columna.');
// //     block.setEnabled(false);
// //     return;
// //   }

// //   // Deshabilitar DEFAULT si existe en la misma cadena
// //   const parent = getParentColumnBlock(block);
// //   if (parent) {
// //     let current = parent.nextConnection && parent.nextConnection.targetBlock();
// //     while (current && current.type !== 'sql_column_definition' && current.type !== 'sql_column_primary_key') {
// //       if (current.type === 'sql_column_default') {
// //         current.setWarningText('DEFAULT no es compatible con UNIQUE.');
// //         current.setEnabled(false);
// //       }
// //       current = current.nextConnection && current.nextConnection.targetBlock();
// //     }
// //   }

// //   block.setWarningText(null);
// //   block.setEnabled(true);
// // };

// // // ─────────────────────────────────────────────
// // // DEFAULT
// // // ─────────────────────────────────────────────
// // export const COLUMN_DEFAULT_DEFINITION = {
// //   "type": "sql_column_default",
// //   "message0": "DEFAULT %1",
// //   "args0": [
// //     { "type": "field_input", "name": "DEFAULT_VALUE", "text": "0" }
// //   ],
// //   "previousStatement": ["ColumnDefinition", "ColumnConstraint"],
// //   "nextStatement":     ["ColumnConstraint", "ColumnDefinition"],
// //   "colour": 160,
// //   "tooltip": "Valor por defecto para la columna.",
// //   "helpUrl": ""
// // };

// // export const COLUMN_DEFAULT_GENERATOR = function(block, generator) {
// //   const defaultValue = block.getFieldValue('DEFAULT_VALUE');
// //   return `DEFAULT ${defaultValue}`;
// // };

// // export const COLUMN_DEFAULT_ONCHANGE = function(event) {
// //   if (event.type !== 'block_move' && event.type !== 'block_change') return;
// //   const block = this;
// //   if (block.isInFlyout) return;

// //   const siblings = getSiblingConstraintTypes(block);

// //   if (siblings.includes('sql_column_default')) {
// //     block.setWarningText('DEFAULT ya está definido en esta columna.');
// //     block.setEnabled(false);
// //     return;
// //   }
// //   if (siblings.includes('sql_column_unique')) {
// //     block.setWarningText('DEFAULT no es compatible con UNIQUE.');
// //     block.setEnabled(false);
// //     return;
// //   }

// //   block.setWarningText(null);
// //   block.setEnabled(true);
// // };

// // // ─────────────────────────────────────────────
// // // CHECK
// // // ─────────────────────────────────────────────
// // export const COLUMN_CHECK_DEFINITION = {
// //   "type": "sql_column_check",
// //   "message0": "CHECK ( %1 )",
// //   "args0": [
// //     { "type": "field_input", "name": "CHECK_CONDITION", "text": "columna > 0" }
// //   ],
// //   "previousStatement": ["ColumnDefinition", "ColumnConstraint"],
// //   "nextStatement":     ["ColumnConstraint", "ColumnDefinition"],
// //   "colour": 160,
// //   "tooltip": "Condición que debe cumplir esta columna.",
// //   "helpUrl": ""
// // };

// // export const COLUMN_CHECK_GENERATOR = function(block, generator) {
// //   const condition = block.getFieldValue('CHECK_CONDITION');
// //   return `CHECK (${condition})`;
// // };

// // export const COLUMN_CHECK_ONCHANGE = function(event) {
// //   if (event.type !== 'block_move' && event.type !== 'block_change') return;
// //   const block = this;
// //   if (block.isInFlyout) return;

// //   const siblings = getSiblingConstraintTypes(block);
// //   if (siblings.includes('sql_column_check')) {
// //     block.setWarningText('CHECK ya está definido en esta columna.');
// //     block.setEnabled(false);
// //   } else {
// //     block.setWarningText(null);
// //     block.setEnabled(true);
// //   }
// // };

// // // ─────────────────────────────────────────────
// // // REFERENCES
// // // ─────────────────────────────────────────────
// // export const COLUMN_REFERENCES_DEFINITION = {
// //   "type": "sql_column_references",
// //   "message0": "REFERENCES %1 ( %2 )",
// //   "args0": [
// //     { "type": "field_input", "name": "REF_TABLE",  "text": "tabla_ref" },
// //     { "type": "field_input", "name": "REF_COLUMN", "text": "id" }
// //   ],
// //   "previousStatement": ["ColumnDefinition", "ColumnConstraint"],
// //   "nextStatement":     ["ColumnConstraint", "ColumnDefinition"],
// //   "colour": 160,
// //   "tooltip": "Clave foránea que referencia a otra tabla.",
// //   "helpUrl": ""
// // };

// // export const COLUMN_REFERENCES_GENERATOR = function(block, generator) {
// //   const refTable  = block.getFieldValue('REF_TABLE');
// //   const refColumn = block.getFieldValue('REF_COLUMN');
// //   return `REFERENCES ${refTable}(${refColumn})`;
// // };

// // export const COLUMN_REFERENCES_ONCHANGE = function(event) {
// //   if (event.type !== 'block_move' && event.type !== 'block_change') return;
// //   const block = this;
// //   if (block.isInFlyout) return;

// //   const siblings = getSiblingConstraintTypes(block);
// //   if (siblings.includes('sql_column_references')) {
// //     block.setWarningText('REFERENCES ya está definido en esta columna.');
// //     block.setEnabled(false);
// //   } else {
// //     block.setWarningText(null);
// //     block.setEnabled(true);
// //   }
// // };

// //===
// // Tipos numéricos/enteros compatibles con IDENTITY
// const IDENTITY_COMPATIBLE_TYPES = ['INTEGER', 'FLOAT'];

// // Helper: sube por la cadena horizontal hasta encontrar el sql_column_definition padre
// function getParentColumnBlock(block) {
//   let current = block;
//   while (current) {
//     // Sube via outputConnection → el input_value del bloque anterior
//     const outputConn = current.outputConnection;
//     if (!outputConn || !outputConn.targetConnection) return null;

//     const parentBlock = outputConn.targetConnection.getSourceBlock();
//     if (!parentBlock) return null;

//     if (parentBlock.type === 'sql_column_definition') return parentBlock;

//     // El padre es otro constraint, seguir subiendo
//     current = parentBlock;
//   }
//   return null;
// }

// // Helper: recoge todos los tipos de constraint en la cadena excepto el bloque actual
// function getSiblingConstraintTypes(block) {
//   const parent = getParentColumnBlock(block);
//   if (!parent) return [];

//   const types = [];
//   let current = parent.getInputTargetBlock('FIRST_CONSTRAINT');
//   while (current) {
//     if (current.id !== block.id) types.push(current.type);
//     current = current.getInputTargetBlock('NEXT_CONSTRAINT');
//   }
//   return types;
// }

// // Definición base reutilizable para constraints
// function makeConstraintDefinition(type, message, args, tooltip) {
//   return {
//     "type": type,
//     "message0": args && args.length > 0 ? `${message} %${args.length + 1}` : `${message} %1`,
//     "args0": [
//       ...(args || []),
//       {
//         "type": "input_value",
//         "name": "NEXT_CONSTRAINT",
//         "check": "ColumnConstraint"
//       }
//     ],
//     "inputsInline": true,
//     "output": "ColumnConstraint",
//     "colour": 160,
//     "tooltip": tooltip,
//     "helpUrl": ""
//   };
// }

// // ─────────────────────────────────────────────
// // IDENTITY
// // ─────────────────────────────────────────────
// export const COLUMN_IDENTITY_DEFINITION = makeConstraintDefinition(
//   "sql_column_identity",
//   "IDENTITY ( %1 , %2 )",
//   [
//     { "type": "field_number", "name": "SEED",      "value": 1, "precision": 1 },
//     { "type": "field_number", "name": "INCREMENT", "value": 1, "precision": 1 }
//   ],
//   "Auto-incremento. Solo válido para tipos numéricos enteros."
// );

// export const COLUMN_IDENTITY_GENERATOR = function(block, generator) {
//   const seed      = block.getFieldValue('SEED');
//   const increment = block.getFieldValue('INCREMENT');
//   return [`IDENTITY(${seed},${increment})`, 0];
// };

// export const COLUMN_IDENTITY_ONCHANGE = function(event) {
//   if (event.type !== 'block_move' && event.type !== 'block_change') return;
//   const block = this;
//   if (block.isInFlyout) return;

//   const parent = getParentColumnBlock(block);
//   if (!parent) return;

//   const dataType     = parent.getFieldValue('DATA_TYPE');
//   const isCompatible = IDENTITY_COMPATIBLE_TYPES.includes(dataType);

//   if (!isCompatible) {
//     block.setWarningText('IDENTITY solo es compatible con tipos numéricos (INTEGER, FLOAT).');
//     block.setEnabled(false);
//   } else {
//     block.setWarningText(null);
//     block.setEnabled(true);
//   }
// };

// // ─────────────────────────────────────────────
// // NOT NULL
// // ─────────────────────────────────────────────
// export const COLUMN_NOT_NULL_DEFINITION = makeConstraintDefinition(
//   "sql_column_not_null",
//   "NOT NULL",
//   [],
//   "La columna no puede contener valores NULL."
// );

// export const COLUMN_NOT_NULL_GENERATOR = function(block, generator) {
//   return [`NOT NULL`, 0];
// };

// export const COLUMN_NOT_NULL_ONCHANGE = function(event) {
//   if (event.type !== 'block_move' && event.type !== 'block_change') return;
//   const block = this;
//   if (block.isInFlyout) return;

//   const siblings = getSiblingConstraintTypes(block);
//   if (siblings.includes('sql_column_not_null')) {
//     block.setWarningText('NOT NULL ya está definido en esta columna.');
//     block.setEnabled(false);
//   } else {
//     block.setWarningText(null);
//     block.setEnabled(true);
//   }
// };

// // ─────────────────────────────────────────────
// // UNIQUE
// // ─────────────────────────────────────────────
// export const COLUMN_UNIQUE_DEFINITION = makeConstraintDefinition(
//   "sql_column_unique",
//   "UNIQUE",
//   [],
//   "Los valores de esta columna deben ser únicos."
// );

// export const COLUMN_UNIQUE_GENERATOR = function(block, generator) {
//   return [`UNIQUE`, 0];
// };

// export const COLUMN_UNIQUE_ONCHANGE = function(event) {
//   if (event.type !== 'block_move' && event.type !== 'block_change') return;
//   const block = this;
//   if (block.isInFlyout) return;

//   const siblings = getSiblingConstraintTypes(block);

//   if (siblings.includes('sql_column_unique')) {
//     block.setWarningText('UNIQUE ya está definido en esta columna.');
//     block.setEnabled(false);
//     return;
//   }

//   // Deshabilitar DEFAULT si existe en la misma cadena
//   const parent = getParentColumnBlock(block);
//   if (parent) {
//     let current = parent.getInputTargetBlock('FIRST_CONSTRAINT');
//     while (current) {
//       if (current.type === 'sql_column_default') {
//         current.setWarningText('DEFAULT no es compatible con UNIQUE.');
//         current.setEnabled(false);
//       }
//       current = current.getInputTargetBlock('NEXT_CONSTRAINT');
//     }
//   }

//   block.setWarningText(null);
//   block.setEnabled(true);
// };

// // ─────────────────────────────────────────────
// // DEFAULT
// // ─────────────────────────────────────────────
// export const COLUMN_DEFAULT_DEFINITION = makeConstraintDefinition(
//   "sql_column_default",
//   "DEFAULT %1",
//   [
//     { "type": "field_input", "name": "DEFAULT_VALUE", "text": "0" }
//   ],
//   "Valor por defecto para la columna."
// );

// export const COLUMN_DEFAULT_GENERATOR = function(block, generator) {
//   const defaultValue = block.getFieldValue('DEFAULT_VALUE');
//   return [`DEFAULT ${defaultValue}`, 0];
// };

// export const COLUMN_DEFAULT_ONCHANGE = function(event) {
//   if (event.type !== 'block_move' && event.type !== 'block_change') return;
//   const block = this;
//   if (block.isInFlyout) return;

//   const siblings = getSiblingConstraintTypes(block);

//   if (siblings.includes('sql_column_default')) {
//     block.setWarningText('DEFAULT ya está definido en esta columna.');
//     block.setEnabled(false);
//     return;
//   }
//   if (siblings.includes('sql_column_unique')) {
//     block.setWarningText('DEFAULT no es compatible con UNIQUE.');
//     block.setEnabled(false);
//     return;
//   }

//   block.setWarningText(null);
//   block.setEnabled(true);
// };

// // ─────────────────────────────────────────────
// // CHECK
// // ─────────────────────────────────────────────
// export const COLUMN_CHECK_DEFINITION = makeConstraintDefinition(
//   "sql_column_check",
//   "CHECK ( %1 )",
//   [
//     { "type": "field_input", "name": "CHECK_CONDITION", "text": "columna > 0" }
//   ],
//   "Condición que debe cumplir esta columna."
// );

// export const COLUMN_CHECK_GENERATOR = function(block, generator) {
//   const condition = block.getFieldValue('CHECK_CONDITION');
//   return [`CHECK (${condition})`, 0];
// };

// export const COLUMN_CHECK_ONCHANGE = function(event) {
//   if (event.type !== 'block_move' && event.type !== 'block_change') return;
//   const block = this;
//   if (block.isInFlyout) return;

//   const siblings = getSiblingConstraintTypes(block);
//   if (siblings.includes('sql_column_check')) {
//     block.setWarningText('CHECK ya está definido en esta columna.');
//     block.setEnabled(false);
//   } else {
//     block.setWarningText(null);
//     block.setEnabled(true);
//   }
// };

// // ─────────────────────────────────────────────
// // REFERENCES
// // ─────────────────────────────────────────────
// export const COLUMN_REFERENCES_DEFINITION = makeConstraintDefinition(
//   "sql_column_references",
//   "REFERENCES %1 ( %2 )",
//   [
//     { "type": "field_input", "name": "REF_TABLE",  "text": "tabla_ref" },
//     { "type": "field_input", "name": "REF_COLUMN", "text": "id" }
//   ],
//   "Clave foránea que referencia a otra tabla."
// );

// export const COLUMN_REFERENCES_GENERATOR = function(block, generator) {
//   const refTable  = block.getFieldValue('REF_TABLE');
//   const refColumn = block.getFieldValue('REF_COLUMN');
//   return [`REFERENCES ${refTable}(${refColumn})`, 0];
// };

// export const COLUMN_REFERENCES_ONCHANGE = function(event) {
//   if (event.type !== 'block_move' && event.type !== 'block_change') return;
//   const block = this;
//   if (block.isInFlyout) return;

//   const siblings = getSiblingConstraintTypes(block);
//   if (siblings.includes('sql_column_references')) {
//     block.setWarningText('REFERENCES ya está definido en esta columna.');
//     block.setEnabled(false);
//   } else {
//     block.setWarningText(null);
//     block.setEnabled(true);
//   }
// };


import * as Blockly from 'blockly';

function buildConstraintInit(Blockly, setupFn, tooltip) {
  return {
    init: function() {
      const input = this.appendValueInput('NEXT_CONSTRAINT')
        .setCheck('ColumnConstraint');
      setupFn(this, input);
      this.setInputsInline(false);
      this.setOutput(true, 'ColumnConstraint');
      this.setColour(160);
      this.setTooltip(tooltip);
      this.setHelpUrl('');
    }
  };
}

// IDENTITY
export function columnIdentityBlockInit(Blockly) {
  return buildConstraintInit(
    Blockly,
    (block, input) => {
      input
        .appendField('IDENTITY(')
        .appendField(new Blockly.FieldNumber(1, null, null, 1), 'SEED')
        .appendField(',')
        .appendField(new Blockly.FieldNumber(1, null, null, 1), 'INCREMENT')
        .appendField(')');
    },
    'Auto-incremento. Solo válido para tipos numéricos enteros. \n Formato: IDENTITY (semilla, incremento).'
  );
}

export const COLUMN_IDENTITY_GENERATOR = function(block, generator) {
  const seed      = block.getFieldValue('SEED');
  const increment = block.getFieldValue('INCREMENT');
  const next = generator.valueToCode(block, 'NEXT_CONSTRAINT', 0);
  const code = next
    ? `IDENTITY(${seed},${increment}) ${next}`
    : `IDENTITY(${seed},${increment})`;
  return [code, 0];
};

// NOT NULL
export function columnNotNullBlockInit(Blockly) {
  return buildConstraintInit(
    Blockly,
    (block, input) => { input.appendField('NOT NULL'); },
    'La columna no puede contener valores NULL.'
  );
}

export const COLUMN_NOT_NULL_GENERATOR = function(block, generator) {
  const next = generator.valueToCode(block, 'NEXT_CONSTRAINT', 0);
  return [next ? `NOT NULL ${next}` : 'NOT NULL', 0];
};

// UNIQUE
export function columnUniqueBlockInit(Blockly) {
  return buildConstraintInit(
    Blockly,
    (block, input) => { input.appendField('UNIQUE'); },
    'Los valores de esta columna deben ser únicos.'
  );
}

export const COLUMN_UNIQUE_GENERATOR = function(block, generator) {
  const next = generator.valueToCode(block, 'NEXT_CONSTRAINT', 0);
  return [next ? `UNIQUE ${next}` : 'UNIQUE', 0];
};

// DEFAULT
export function columnDefaultBlockInit(Blockly) {
  return buildConstraintInit(
    Blockly,
    (block, input) => {
      input
        .appendField('DEFAULT')
        .appendField(new Blockly.FieldTextInput('0'), 'DEFAULT_VALUE');
    },
    'Valor por defecto para la columna.'
  );
}

export const COLUMN_DEFAULT_GENERATOR = function(block, generator) {
  const val  = block.getFieldValue('DEFAULT_VALUE');
  const next = generator.valueToCode(block, 'NEXT_CONSTRAINT', 0);
  return [next ? `DEFAULT ${val} ${next}` : `DEFAULT ${val}`, 0];
};

// CHECK
export function columnCheckBlockInit(Blockly) {
  return buildConstraintInit(
    Blockly,
    (block, input) => {
      input
        .appendField('CHECK (')
        .appendField(new Blockly.FieldTextInput('columna > 0'), 'CHECK_CONDITION')
        .appendField(')');
    },
    'Condición que debe cumplir esta columna.'
  );
}

export const COLUMN_CHECK_GENERATOR = function(block, generator) {
  const cond = block.getFieldValue('CHECK_CONDITION');
  const next = generator.valueToCode(block, 'NEXT_CONSTRAINT', 0);
  return [next ? `CHECK (${cond}) ${next}` : `CHECK (${cond})`, 0];
};

// REFERENCES
export function columnReferencesBlockInit(Blockly) {
  return buildConstraintInit(
    Blockly,
    (block, input) => {
      input
        .appendField('REFERENCES')
        .appendField(new Blockly.FieldTextInput('tabla_ref'), 'REF_TABLE')
        .appendField('(')
        .appendField(new Blockly.FieldTextInput('id'), 'REF_COLUMN')
        .appendField(')');
    },
    'Clave foránea que referencia a otra tabla.'
  );
}

export const COLUMN_REFERENCES_GENERATOR = function(block, generator) {
  const refTable  = block.getFieldValue('REF_TABLE');
  const refColumn = block.getFieldValue('REF_COLUMN');
  const next = generator.valueToCode(block, 'NEXT_CONSTRAINT', 0);
  return [next ? `REFERENCES ${refTable}(${refColumn}) ${next}` : `REFERENCES ${refTable}(${refColumn})`, 0];
};