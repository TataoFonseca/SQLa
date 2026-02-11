// sqla-app/src/js/blocks/dml_DistinctBlock.js
// Bloque DISTINCT que envuelve expresiones

export const DISTINCT_DEFINITION = {
  "type": "sql_distinct",
  "message0": "DISTINCT %1",
  "args0": [
    {
      "type": "input_value",
      "name": "EXPRESSION",
      "check": ["Expression", "TopExpression", "Column"]
    }
  ],
  "output": "DistinctExpression",
  "colour": 230,
  "tooltip": "Aplica DISTINCT a la expresión para eliminar duplicados",
  "helpUrl": ""
};

export const DISTINCT_GENERATOR = function(block, generator) {
  const expression = generator.valueToCode(block, 'EXPRESSION', generator.ORDER_ATOMIC) || '';
  
  if (!expression) {
    return ['', generator.ORDER_NONE];
  }
  
  const code = 'DISTINCT ' + expression;
  return [code, generator.ORDER_ATOMIC];
};
