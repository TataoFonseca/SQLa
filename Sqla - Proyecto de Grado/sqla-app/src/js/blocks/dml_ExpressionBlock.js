// // sqla-app/src/js/blocks/expressionBlock.js
// // SOLO EXPORTA: La forma (JSON) y el generador (función)

// MEJORADO: Con soporte para menú contextual de DISTINCT/TOP

export const EXPRESSION_DEFINITION = {
  "type": "sql_expression",
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
      "check": ["Expression", "Column", "Aggregate", "DistinctExpression", "TopExpression"]
    }
  ],
  "inputsInline": true,
  "output": ["Expression", "Column"],
  "colour": 160,
  "tooltip": "Nombre de columna. Click derecho para agregar DISTINCT o TOP",
  "helpUrl": "",
  "extensions": ["expression_context_menu"]  // ⭐ APLICAR LA EXTENSIÓN
};

export const EXPRESSION_GENERATOR = function(block, generator) {
  const column = block.getFieldValue('COLUMN');

  // Recorrer la cadena NEXT
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC);
  const code = next ? column + ', ' + next : column;

  return [code, generator.ORDER_ATOMIC];
};

//Registrar EXPRESSION_ONCHANGE para manejar la coma dinámica en appController.js

export const EXPRESSION_ONCHANGE = function(event) {
  if (event.type !== 'move' && event.type !== 'change') return;

  const nextInput = this.getInput('NEXT');
  if (!nextInput) return;

  const isConnected = nextInput.connection && nextInput.connection.isConnected();
  // this.setFieldValue(isConnected ? ',' : '', 'COMMA');

  if (isConnected && !this.getField('COMMA')) {
    nextInput.appendField(',', 'COMMA');
  }

  if (!isConnected && this.getField('COMMA')) {
    nextInput.removeField('COMMA');
  }
};