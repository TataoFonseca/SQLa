// sqla-app/src/js/blocks/dml_OrderByBlock.js
// [Orden de cláusulas DML]
// previousStatement: ["SQL_AFTER_FROM", "SQL_AFTER_WHERE", "SQL_AFTER_GROUPBY", "SQL_AFTER_HAVING"]
//   → ORDER BY puede ir después de FROM, WHERE, GROUP BY o HAVING
// nextStatement: (ninguno) → ORDER BY es la cláusula final, no acepta bloques debajo

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
  "previousStatement": ["SQL_AFTER_FROM", "SQL_AFTER_WHERE", "SQL_AFTER_GROUPBY", "SQL_AFTER_HAVING"],
  "colour": 230,
  "tooltip": "Ordena los resultados. Conecta una o más expresiones de orden.",
  "helpUrl": ""
};

export const ORDER_BY_GENERATOR = function (block, generator) {
  const expression = generator.valueToCode(block, 'EXPRESSION', generator.ORDER_ATOMIC);
  if (!expression) return '';
  return 'ORDER BY ' + expression + '\n';
};