// sqla-app/src/js/blocks/dml_AggregateFunctionsBlock.js
// Funciones de agregación: SUM, AVG, COUNT, MIN, MAX
// Vienen con Expression pre-conectada y solo aceptan DISTINCT (no TOP)
// MEJORADO: Con encadenamiento lateral (NEXT) y coma dinámica

// ==========================================
// Onchange compartido para todos los aggregate blocks
// Muestra/oculta la coma según NEXT esté conectado o no.
// Registrarlo en el generador de bloques en appController.js
// ==========================================

export const AGGREGATE_FUNCTION_ONCHANGE = function(event) {
  if (event.type !== 'move' && event.type !== 'change') return;

  const nextInput = this.getInput('NEXT');
  if (!nextInput) return;

  const isConnected = nextInput.connection && nextInput.connection.isConnected();
  // this.setFieldValue(isConnected ? ',' : '', 'COMMA');

  if (isConnected && !this.getField('COMMA')) {
    nextInput.appendField(',', 'COMMA');
  }

  if (!isConnected && this.getField('COMMA')) {
    nextInput.removeField('COMMA');
  }
};


// ==========================================
// SUM
// ==========================================
export const SUM_DEFINITION = {
  "type": "sql_sum",
  "message0": "SUM ( %1 ) %2",
  "args0": [
    {
      "type": "input_value",
      "name": "EXPRESSION",
      "check": ["Expression", "Column", "DistinctExpression"]  // Solo DISTINCT, no TOP
    },

    {
      "type": "input_value",
      "name": "NEXT",
      "check": ["Expression", "Column", "Aggregate", "DistinctExpression", "TopExpression"]
    }
  ],
  "inputsInline": true,
  "output": ["Aggregate", "Expression"],
  "colour": 120,
  "tooltip": "Suma de valores. Click derecho en la expresión interna para agregar DISTINCT.",
  "helpUrl": "",
  "extensions": ["having_expression_context_menu"]
};

export const SUM_GENERATOR = function(block, generator) {
  const expression = generator.valueToCode(block, 'EXPRESSION', generator.ORDER_ATOMIC) || '*';
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC);
  const code = next ? 'SUM(' + expression + '), ' + next : 'SUM(' + expression + ')';
  return [code, generator.ORDER_ATOMIC]; //cambiado de ORDER_FUNCTION_CALL a ORDER_ATOMIC para evitar paréntesis innecesarios en casos simples
};

// ==========================================
// AVG
// ==========================================
export const AVG_DEFINITION = {
  "type": "sql_avg",
  "message0": "AVG ( %1 ) %2",
  "args0": [
    {
      "type": "input_value",
      "name": "EXPRESSION",
      "check": ["Expression", "Column", "DistinctExpression"]
    },
    {
      "type": "input_value",
      "name": "NEXT",
      "check": ["Expression", "Column", "Aggregate", "DistinctExpression", "TopExpression"]
    }
  ],
  "inputsInline": true,
  "output": ["Aggregate", "Expression"],
  "colour": 120,
  "tooltip": "Promedio de valores. Click derecho en la expresión interna para agregar DISTINCT.",
  "helpUrl": "",
  "extensions": ["having_expression_context_menu"]
};

export const AVG_GENERATOR = function(block, generator) {
  const expression = generator.valueToCode(block, 'EXPRESSION', generator.ORDER_ATOMIC) || '*';
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC);
  const code = next ? 'AVG(' + expression + '), ' + next : 'AVG(' + expression + ')';
  return [code, generator.ORDER_ATOMIC]; //cambiado de ORDER_FUNCTION_CALL a ORDER_ATOMIC para evitar paréntesis innecesarios en casos simples
};

// ==========================================
// COUNT
// ==========================================
export const COUNT_DEFINITION = {
  "type": "sql_count",
  "message0": "COUNT ( %1 ) %2",
  "args0": [
    {
      "type": "input_value",
      "name": "EXPRESSION",
      "check": ["Expression", "Column", "DistinctExpression"]
    },
    {
      "type": "input_value",
      "name": "NEXT",
      "check": ["Expression", "Column", "Aggregate", "DistinctExpression", "TopExpression"]
    }
  ],
  "inputsInline": true,
  "output": ["Aggregate", "Expression"],
  "colour": 120,
  "tooltip": "Conteo de filas. Click derecho en la expresión interna para agregar DISTINCT.",
  "helpUrl": "",
  "extensions": ["having_expression_context_menu"]
};

export const COUNT_GENERATOR = function(block, generator) {
  const expression = generator.valueToCode(block, 'EXPRESSION', generator.ORDER_ATOMIC) || '*';
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC);
  const code = next ? 'COUNT(' + expression + '), ' + next : 'COUNT(' + expression + ')';
  return [code, generator.ORDER_ATOMIC]; //cambiado de ORDER_FUNCTION_CALL a ORDER_ATOMIC para evitar paréntesis innecesarios en casos simples
};

// ==========================================
// MIN
// ==========================================
export const MIN_DEFINITION = {
  "type": "sql_min",
  "message0": "MIN ( %1 ) %2",
  "args0": [
    {
      "type": "input_value",
      "name": "EXPRESSION",
      "check": ["Expression", "Column"]  // MIN/MAX no necesitan DISTINCT
    },
    {
      "type": "input_value",
      "name": "NEXT",
      "check": ["Expression", "Column", "Aggregate", "DistinctExpression", "TopExpression"]
    }
  ],
  "inputsInline": true,
  "output": ["Aggregate", "Expression"],
  "colour": 120,
  "tooltip": "Valor mínimo.",
  "helpUrl": "",
  "extensions": ["having_expression_context_menu"]
};

export const MIN_GENERATOR = function(block, generator) {
  const expression = generator.valueToCode(block, 'EXPRESSION', generator.ORDER_ATOMIC) || '*';
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC);
  const code = next ? 'MIN(' + expression + '), ' + next : 'MIN(' + expression + ')';
  return [code, generator.ORDER_ATOMIC]; //cambiado de ORDER_FUNCTION_CALL a ORDER_ATOMIC para evitar paréntesis innecesarios en casos simples
};

// ==========================================
// MAX
// ==========================================
export const MAX_DEFINITION = {
  "type": "sql_max",
  "message0": "MAX ( %1 ) %2",
  "args0": [
    {
      "type": "input_value",
      "name": "EXPRESSION",
      "check": ["Expression", "Column"]
    },
    {
      "type": "input_value",
      "name": "NEXT",
      "check": ["Expression", "Column", "Aggregate", "DistinctExpression", "TopExpression"]
    }
  ],
  "inputsInline": true,
  "output": ["Aggregate", "Expression"],
  "colour": 120,
  "tooltip": "Valor máximo.",
  "helpUrl": "",
  "extensions": ["having_expression_context_menu"]
};

export const MAX_GENERATOR = function(block, generator) {
  const expression = generator.valueToCode(block, 'EXPRESSION', generator.ORDER_ATOMIC) || '*';
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC);
  const code = next ? 'MAX(' + expression + '), ' + next : 'MAX(' + expression + ')';
  return [code, generator.ORDER_ATOMIC]; //cambiado de ORDER_FUNCTION_CALL a ORDER_ATOMIC para evitar paréntesis innecesarios en casos simples
};