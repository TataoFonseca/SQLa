// sqla-app/src/js/blocks/dml_OrderByBlock.js

export const ORDER_BY_DEFINITION = {
  "type": "sql_order_by",
  "message0": "ORDER BY %1",
  "args0": [
    {
      "type": "input_value",
      "name": "EXPRESSION",
      "check": ["Expression", "Column"]
    }
  ],
  "inputsInline": true,
  "previousStatement": "SQL_STATEMENT",
  "nextStatement": "SQL_STATEMENT",
  "colour": 230,
  "tooltip": "Ordena los resultados. Conecta una o más expresiones y el orden en que quieres presentarlos.",
  "helpUrl": ""
};

export const ORDER_BY_GENERATOR = function (block, generator) {
  const expression = generator.valueToCode(block, 'EXPRESSION', generator.ORDER_ATOMIC);
  if (!expression) return '';
  return 'ORDER BY ' + expression + '\n';
};