// === CONSTRAINT: PRIMARY KEY (columna) ===
// Este bloque incluye NOT NULL implícito (PRIMARY KEY siempre es NOT NULL)

export const COLUMN_PRIMARY_KEY_DEFINITION = {
  "type": "sql_column_primary_key",
  "message0": "NOT NULL PRIMARY KEY",
  "previousStatement": "ColumnConstraint",
  "nextStatement": "ColumnConstraint",
  "colour": 290, // Color especial para PRIMARY KEY
  "tooltip": "Define esta columna como clave primaria. Solo puede haber UNA en toda la tabla. PRIMARY KEY implica NOT NULL automáticamente.",
  "helpUrl": ""
};

// === GENERADOR ===
export const COLUMN_PRIMARY_KEY_GENERATOR = function(block, generator) {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  const separator = nextBlock ? ' ' : '';
  
  // PRIMARY KEY ya implica NOT NULL, no necesitamos escribirlo
  // Pero lo mostramos en el bloque para que sea educativo
  return `PRIMARY KEY${separator}`;
};
