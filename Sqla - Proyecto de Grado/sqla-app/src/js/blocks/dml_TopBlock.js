// sqla-app/src/js/blocks/dml_TopBlock.js
// Bloque TOP que limita número de resultados

export const TOP_DEFINITION = {
  "type": "sql_top",
  "message0": "TOP ( %1 ) %2",
  "args0": [
    {
      "type": "field_number",
      "name": "NUMBER",
      "value": 10,
      "min": 1
    },
    {
      "type": "input_value",
      // "name": "EXPRESSION",
      "name": "NEXT",
      // "check": ["Expression", "Column"],
      "check": ["Expression", "Column", "Aggregate"],
      "align": "RIGHT"
    }
  ],
  "inputsInline": false,
  // "output": "TopExpression",
  "output": "TopFlag",
  "colour": 230,
  "tooltip": "Limita el número de filas a retornar",
  "helpUrl": ""
};

export const TOP_GENERATOR = function (block, generator) {
  const number = block.getFieldValue('NUMBER');
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC);
  if (!next) return [`TOP (${number})`, generator.ORDER_ATOMIC];
  return [`TOP (${number}) ${next}`, generator.ORDER_ATOMIC];
};
