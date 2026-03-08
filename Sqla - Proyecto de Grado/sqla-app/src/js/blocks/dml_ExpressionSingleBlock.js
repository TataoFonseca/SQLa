// sqla-app/src/js/blocks/dml_ExpressionSingleBlock.js

export const EXPRESSION_SINGLE_DEFINITION = {
  "type": "sql_expression_single",
  "message0": "%1",
  "args0": [
    {
      "type": "field_input",
      "name": "COLUMN",
      "text": "value"
    }
  ],
  "inputsInline": true,
  "output": ["Expression", "Column"],
  "colour": 160,
  "tooltip": "Valor o columna. En HAVING: click derecho para agregar comparación.",
  "helpUrl": "",
  "extensions": ["having_expression_context_menu"]
};

export const EXPRESSION_SINGLE_GENERATOR = function(block, generator) {
  const column = block.getFieldValue('COLUMN');
  return [column, generator.ORDER_ATOMIC];
};