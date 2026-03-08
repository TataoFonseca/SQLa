// sqla-app/src/js/blocks/dml_MembershipBlock.js
// Creado exclusivamente desde havingExpressionContextMenu

export const MEMBERSHIP_DEFINITION = {
  "type": "sql_membership",
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
        ["IN",     "IN"],
        ["NOT IN", "NOT IN"]
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
  "tooltip": "Pertenencia: expresión IN/NOT IN (valor). Se agrega desde click derecho en HAVING.",
  "helpUrl": ""
};

export const MEMBERSHIP_GENERATOR = function(block, generator) {
  const left  = generator.valueToCode(block, 'LEFT',  generator.ORDER_ATOMIC) || '??';
  const op    = block.getFieldValue('OPERATOR');
  const right = generator.valueToCode(block, 'RIGHT', generator.ORDER_ATOMIC) || '??';
  return [`${left} ${op} (${right})`, generator.ORDER_ATOMIC];
};