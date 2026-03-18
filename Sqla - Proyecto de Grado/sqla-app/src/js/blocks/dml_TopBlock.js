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
      "name": "EXPRESSION",
      "check": ["Expression", "Column"],
      "align": "RIGHT"
    }
  ],
  "inputsInline": true,
  "output": "TopExpression",
  "colour": 230,
  "tooltip": "Limita el número de filas retornadas",
  "helpUrl": ""
};

export const TOP_GENERATOR = function (block, generator) {
  const number = block.getFieldValue('NUMBER');
  const expression = generator.valueToCode(block, 'EXPRESSION', generator.ORDER_ATOMIC) || '';

  if (!expression) {
    return ['', generator.ORDER_NONE];
  }

  const code = 'TOP (' + number + ') ' + expression;
  return [code, generator.ORDER_ATOMIC];
};
