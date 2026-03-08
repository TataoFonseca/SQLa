// sqla-app/src/js/blocks/dml_HavingBlock.js

export const HAVING_DEFINITION = {
  "type": "sql_having",
  "message0": "HAVING %1",
  "args0": [
    {
      "type": "input_value",
      "name": "EXPRESSION",
      "check": ["Expression", "Column", "Aggregate", "Condition"]
    }
  ],
  "inputsInline": true,
  "previousStatement": "SQL_STATEMENT",
  "nextStatement": "SQL_STATEMENT",
  "colour": 200,
  "tooltip": "Filtra grupos después del GROUP BY. Conecta una Expression o función de agregación.",
  "helpUrl": ""
};

export const HAVING_GENERATOR = function(block, generator) {
  const expression = generator.valueToCode(block, 'EXPRESSION', generator.ORDER_ATOMIC);
  if (!expression) return '';
  return 'HAVING ' + expression + '\n';
};