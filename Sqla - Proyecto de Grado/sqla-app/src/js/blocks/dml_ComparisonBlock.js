// sqla-app/src/js/blocks/dml_ComparisonBlock.js
// Creado exclusivamente desde havingExpressionContextMenu — NO se arrastra solo
// LEFT lo hereda del bloque que lo invoca, RIGHT se auto-inserta como ExpressionSingle

export const COMPARISON_DEFINITION = {
  "type": "sql_comparison",
  "message0": "%1 %2 %3",
  "args0": [
    {
      "type": "input_value",
      "name": "LEFT",
      "check": ["Expression", "Column", "Aggregate"]
    },
    {
      "type": "field_dropdown",
      "name": "OPERATOR",
      "options": [
        ["=",  "="],
        ["<>", "<>"],
        ["!=", "!="],
        ["<",  "<"],
        [">",  ">"],
        ["<=", "<="],
        [">=", ">="]
      ]
    },
    {
      "type": "input_value",
      "name": "RIGHT",
      "check": ["Expression", "Column"]
    }
  ],
  "inputsInline": true,
  "output": ["Condition"],
  "colour": 30,
  "tooltip": "Comparación: expresión [operador] valor. Se agrega desde click derecho en HAVING.",
  "helpUrl": ""
};

export const COMPARISON_GENERATOR = function(block, generator) {
  const left  = generator.valueToCode(block, 'LEFT',  generator.ORDER_ATOMIC) || '??';
  const op    = block.getFieldValue('OPERATOR');
  const right = generator.valueToCode(block, 'RIGHT', generator.ORDER_ATOMIC) || '??';
  return [`${left} ${op} ${right}`, generator.ORDER_ATOMIC];
};