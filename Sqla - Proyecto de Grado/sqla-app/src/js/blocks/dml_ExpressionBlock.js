// // sqla-app/src/js/blocks/expressionBlock.js
// // SOLO EXPORTA: La forma (JSON) y el generador (función)

// MEJORADO: Con soporte para menú contextual de DISTINCT/TOP
// Este bloque usa el patrón init en lugar de JSON puro porque appendField sobre input_value no es soportado en JSON block definitions, pero es necesario para necesario para fusionar, por eso se exporta la funcion expressionBlockDefinition, la cual se importa en appController.js y se usa para definir el bloque sql_expression, en lugar de usar un JSON puro. 
// El campo COLUMN y el input NEXT conservan los mismos nombres — 
// el generador y el menú contextual no necesitan cambios.

export function expressionBlockDefinition(Blockly) {
  return {
    init: function () {
      this.appendValueInput('NEXT')
        .setCheck(["Expression", "Column", "Aggregate", "DistinctExpression", "TopExpression"])
        .appendField(new Blockly.FieldTextInput('column_name'), 'COLUMN');
      this.setInputsInline(false);
      this.setOutput(true, ["Expression", "Column"]);
      this.setColour(160);
      this.setTooltip('Nombre de columna. Click derecho para agregar DISTINCT o TOP');
      this.setHelpUrl('');
      // Blockly.Extensions.apply('expression_context_menu', this, false); //Extension del menu contextual para agregar DISTINCT o TOP
      Blockly.Extensions.apply('order_by_expression_extension', this, false); //Extension para poder insertarse dentro del bloque ORDER BY
    }
  };
}

export const EXPRESSION_GENERATOR = function (block, generator) {
  const column = block.getFieldValue('COLUMN');
  const direction = block.getFieldValue('DIRECTION'); //Agregado, este "DIRECTION" lo aporta la extensión orderByExpressionExtension y solo se mostrará si el bloque está conectado a un con sql_order_by
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC); // Este "NEXT" lo aporta la extensión expressionContextMenu y solo mostrará las opciones DISTINCT o TOP si el bloque está conectado o es adyacente a un bloque sql_select
  // const code = next ? column + ', ' + next : column;
  const self = direction ? `${column} ${direction}` : column; 
  const code = next ? `${self}, ${next}` : self;
  return [code, generator.ORDER_ATOMIC];
};

export const EXPRESSION_ONCHANGE = function (event) {
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