// sqla-app/src/js/blocks/dml_ExpressionBlock.js
//
// Define el bloque sql_expression (columna simple encadenable).
//
// Usa el patrón init en lugar de JSON puro porque appendField sobre un
// input_value no está soportado en las definiciones JSON de Blockly, y es
// necesario para fusionar campos con la conexión de valor.
//
// Extensiones aplicadas en init:
//   - order_by_expression_extension: detecta si el bloque está dentro de
//     sql_order_by y, de ser así, añade dinámicamente el dropdown DIRECTION
//     (ASC/DESC) al input NEXT. Ver orderByExpressionExtension.js.
//
// Lo que NO hace este bloque:
//   - No aplica selectContextMenu, whereContextMenu ni havingExpressionContextMenu.
//   - sql_expression_single es un bloque separado y no recibe ninguna de estas
//     extensiones.

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

      // Habilita el dropdown ASC/DESC cuando el bloque se conecta a ORDER BY.
      Blockly.Extensions.apply('order_by_expression_extension', this, false);
    }
  };
}

export const EXPRESSION_GENERATOR = function (block, generator) {
  const column = block.getFieldValue('COLUMN');

  // DIRECTION es inyectado por order_by_expression_extension únicamente cuando
  // el bloque está dentro de sql_order_by. Si no existe, getFieldValue devuelve
  // null y el bloque se comporta igual que antes.
  const direction = block.getFieldValue('DIRECTION');

  // NEXT encadena expresiones lateralmente (col1, col2, …).
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC);

  const self = direction ? `${column} ${direction}` : column;
  const code = next ? `${self}, ${next}` : self;
  return [code, generator.ORDER_ATOMIC];
};

// EXPRESSION_ONCHANGE gestiona únicamente la coma dinámica del input NEXT:
// la añade cuando hay un bloque conectado y la quita cuando se desconecta.
// El dropdown DIRECTION es gestionado completamente por order_by_expression_extension,
// por lo que este handler no necesita saber nada del ORDER BY.
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