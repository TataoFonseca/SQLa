// sqla-app/src/js/blocks/dml_GroupByColumnBlock.js
// ColumnExpression exclusivo para GROUP BY
// - Output type: "GroupByColumn" (evita mezcla con sql_expression)
// - NEXT acepta otro GroupByColumn (cadena de columnas)
// - Coma dinámica igual que sql_expression (EXPRESSION_ONCHANGE)
// - Sin menú contextual de DISTINCT/TOP

export const GROUPBY_COLUMN_DEFINITION = {
  "type": "sql_groupby_column",
  "message0": "%1 %2",
  "args0": [
    {
      "type": "field_input",
      "name": "COLUMN",
      "text": "column_name"
    },
    {
      "type": "input_value",
      "name": "NEXT",
      "check": ["GroupByColumn"]
    }
  ],
  "inputsInline": true,
  "output": ["GroupByColumn"],
  "colour": 200,
  "tooltip": "Columna para agrupar. Conecta otro bloque en NEXT para agregar más columnas.",
  "helpUrl": ""
};

export const GROUPBY_COLUMN_GENERATOR = function(block, generator) {
  const column = block.getFieldValue('COLUMN');
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC);
  const code = next ? column + ', ' + next : column;
  return [code, generator.ORDER_ATOMIC];
};

// Coma dinámica: idéntica a EXPRESSION_ONCHANGE en dml_ExpressionBlock.js
export const GROUPBY_COLUMN_ONCHANGE = function(event) {
  if (event.type !== 'move' && event.type !== 'change') return;

  const nextInput = this.getInput('NEXT');
  if (!nextInput) return;

  const isConnected = nextInput.connection && nextInput.connection.isConnected();

  if (isConnected && !this.getField('COMMA')) {
    nextInput.appendField(',', 'COMMA');
  }

  if (!isConnected && this.getField('COMMA')) {
    nextInput.removeField('COMMA');
  }
};
