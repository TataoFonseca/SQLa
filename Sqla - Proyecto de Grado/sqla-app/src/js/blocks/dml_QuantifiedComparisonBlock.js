// sqla-app/src/js/blocks/dml_QuantifiedComparisonBlock.js
// Creado exclusivamente desde havingExpressionContextMenu

export const QUANTIFIED_COMPARISON_DEFINITION = {
  "type": "sql_quantified_comparison",
  "message0": "%1 %2 %3 %4",
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
      "type": "field_dropdown",
      "name": "QUANTIFIER",
      "options": [
        ["ALL",  "ALL"],
        ["ANY",  "ANY"],
        ["SOME", "SOME"]
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
  "tooltip": "Comparación cuantificada: expresión [op] ALL/ANY/SOME (valor). Se agrega desde click derecho en HAVING.",
  "helpUrl": ""
};

export const QUANTIFIED_COMPARISON_GENERATOR = function(block, generator) {
  const left       = generator.valueToCode(block, 'LEFT',  generator.ORDER_ATOMIC) || '??';
  const op         = block.getFieldValue('OPERATOR');
  const quantifier = block.getFieldValue('QUANTIFIER');
  const right      = generator.valueToCode(block, 'RIGHT', generator.ORDER_ATOMIC) || '??';
  return [`${left} ${op} ${quantifier} (${right})`, generator.ORDER_ATOMIC];
};