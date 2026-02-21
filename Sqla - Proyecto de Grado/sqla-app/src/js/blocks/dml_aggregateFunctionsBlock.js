// sqla-app/src/js/blocks/dml_AggregateFunctionsBlock.js
// Funciones de agregación: SUM, AVG, COUNT, MIN, MAX
// Vienen con Expression pre-conectada y solo aceptan DISTINCT (no TOP)

// ==========================================
// SUM
// ==========================================
export const SUM_DEFINITION = {
  "type": "sql_sum",
  "message0": "SUM ( %1 )",
  "args0": [
    {
      "type": "input_value",
      "name": "EXPRESSION",
      "check": ["Expression", "Column", "DistinctExpression"]  // Solo DISTINCT, no TOP
    }
  ],
  "inputsInline": true,
  "output": ["Aggregate", "Expression"],
  "colour": 120,
  "tooltip": "Suma de valores. Click derecho en la expresión interna para agregar DISTINCT.",
  "helpUrl": ""
};

export const SUM_GENERATOR = function(block, generator) {
  const expression = generator.valueToCode(block, 'EXPRESSION', generator.ORDER_ATOMIC) || '*';
  const code = 'SUM(' + expression + ')';
  return [code, generator.ORDER_ATOMIC]; //cambiado de ORDER_FUNCTION_CALL a ORDER_ATOMIC para evitar paréntesis innecesarios en casos simples
};

// ==========================================
// AVG
// ==========================================
export const AVG_DEFINITION = {
  "type": "sql_avg",
  "message0": "AVG ( %1 )",
  "args0": [
    {
      "type": "input_value",
      "name": "EXPRESSION",
      "check": ["Expression", "Column", "DistinctExpression"]
    }
  ],
  "inputsInline": true,
  "output": ["Aggregate", "Expression"],
  "colour": 120,
  "tooltip": "Promedio de valores. Click derecho en la expresión interna para agregar DISTINCT.",
  "helpUrl": ""
};

export const AVG_GENERATOR = function(block, generator) {
  const expression = generator.valueToCode(block, 'EXPRESSION', generator.ORDER_ATOMIC) || '*';
  const code = 'AVG(' + expression + ')';
  return [code, generator.ORDER_ATOMIC]; //cambiado de ORDER_FUNCTION_CALL a ORDER_ATOMIC para evitar paréntesis innecesarios en casos simples
};

// ==========================================
// COUNT
// ==========================================
export const COUNT_DEFINITION = {
  "type": "sql_count",
  "message0": "COUNT ( %1 )",
  "args0": [
    {
      "type": "input_value",
      "name": "EXPRESSION",
      "check": ["Expression", "Column", "DistinctExpression"]
    }
  ],
  "inputsInline": true,
  "output": ["Aggregate", "Expression"],
  "colour": 120,
  "tooltip": "Conteo de filas. Click derecho en la expresión interna para agregar DISTINCT.",
  "helpUrl": ""
};

export const COUNT_GENERATOR = function(block, generator) {
  const expression = generator.valueToCode(block, 'EXPRESSION', generator.ORDER_ATOMIC) || '*';
  const code = 'COUNT(' + expression + ')';
  return [code, generator.ORDER_ATOMIC]; //cambiado de ORDER_FUNCTION_CALL a ORDER_ATOMIC para evitar paréntesis innecesarios en casos simples
};

// ==========================================
// MIN
// ==========================================
export const MIN_DEFINITION = {
  "type": "sql_min",
  "message0": "MIN ( %1 )",
  "args0": [
    {
      "type": "input_value",
      "name": "EXPRESSION",
      "check": ["Expression", "Column"]  // MIN/MAX no necesitan DISTINCT
    }
  ],
  "inputsInline": true,
  "output": ["Aggregate", "Expression"],
  "colour": 120,
  "tooltip": "Valor mínimo.",
  "helpUrl": ""
};

export const MIN_GENERATOR = function(block, generator) {
  const expression = generator.valueToCode(block, 'EXPRESSION', generator.ORDER_ATOMIC) || '*';
  const code = 'MIN(' + expression + ')';
  return [code, generator.ORDER_ATOMIC]; //cambiado de ORDER_FUNCTION_CALL a ORDER_ATOMIC para evitar paréntesis innecesarios en casos simples
};

// ==========================================
// MAX
// ==========================================
export const MAX_DEFINITION = {
  "type": "sql_max",
  "message0": "MAX ( %1 )",
  "args0": [
    {
      "type": "input_value",
      "name": "EXPRESSION",
      "check": ["Expression", "Column"]
    }
  ],
  "inputsInline": true,
  "output": ["Aggregate", "Expression"],
  "colour": 120,
  "tooltip": "Valor máximo.",
  "helpUrl": ""
};

export const MAX_GENERATOR = function(block, generator) {
  const expression = generator.valueToCode(block, 'EXPRESSION', generator.ORDER_ATOMIC) || '*';
  const code = 'MAX(' + expression + ')';
  return [code, generator.ORDER_ATOMIC]; //cambiado de ORDER_FUNCTION_CALL a ORDER_ATOMIC para evitar paréntesis innecesarios en casos simples
};