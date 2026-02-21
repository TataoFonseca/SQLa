// sqla-app/src/js/blocks/dml_AggregateExpressionBlock.js
// Expression específica para usar dentro de funciones de agregación
// Usa la extensión aggregate_expression_context_menu (solo DISTINCT, no TOP)

export const AGGREGATE_EXPRESSION_DEFINITION = {
  "type": "sql_aggregate_expression",
  "message0": "%1",
  "args0": [
    {
      "type": "field_input",
      "name": "COLUMN",
      "text": "columna"
    }
  ],
  "output": ["Expression", "Column"],
  "colour": 160,
  "tooltip": "Columna dentro de función de agregación. Click derecho para agregar DISTINCT.",
  "helpUrl": "",
  "extensions": ["aggregate_expression_context_menu"]  // ⭐ Usa la extensión de agregación
};

export const AGGREGATE_EXPRESSION_GENERATOR = function(block, generator) {
  const column = block.getFieldValue('COLUMN');
  return [column, generator.ORDER_ATOMIC];
};