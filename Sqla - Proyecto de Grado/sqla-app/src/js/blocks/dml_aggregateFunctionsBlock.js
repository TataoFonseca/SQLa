// sqla-app/src/js/blocks/dml_AggregateFunctionsBlock.js
// Funciones de agregación: SUM, AVG, COUNT, MIN, MAX
// Vienen con Expression pre-conectada y solo aceptan DISTINCT (no TOP)
// MEJORADO: Con encadenamiento lateral (NEXT) y coma dinámica

// ==========================================
// Onchange compartido para todos los aggregate blocks
// Muestra/oculta la coma según NEXT esté conectado o no.
// Registrarlo en el generador de bloques en appController.js
// ==========================================

export const AGGREGATE_FUNCTION_ONCHANGE = function(event) {
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

// ==========================================
// ¡Agregado!
// Helper interno con el nuevo diseño que incluye el campo DISTINCT y el input NEXT para encadenar agregados con coma dinámica.
// Recibe Blockly, el label de la función (ej. 'SUM('), el tipo, el check de EXPRESSION y el tooltip.
// ==========================================
function buildAggregateInit(Blockly, label, check, tooltip) {
  return {
    init: function () {
      this.appendValueInput('NEXT')
          .setCheck(["Expression", "Column", "Aggregate", "DistinctExpression", "TopExpression"])
          .appendField(label)
          .appendField(
            new Blockly.FieldLabel('DISTINCT'),
            'DISTINCT'
          )
          .appendField(
            new Blockly.FieldTextInput('columna'),
            'COLUMN'
          )
          .appendField(')');
      this.setInputsInline(false);
      this.setOutput(true, ["Aggregate", "Expression"]);
      this.setColour(120);
      this.setTooltip(tooltip);
      this.setHelpUrl('');

      // DISTINCT oculto por defecto
      this.getField('DISTINCT').setVisible(false);

      Blockly.Extensions.apply('aggregate_functions_context_menu', this, false);
    }
  };
}


// ==========================================
// SUM - Actualizado, ahora DISTINCT es un campo que se muestra/oculta en el mismo bloque, y se agregó el input NEXT para permitir encadenar agregados con coma dinámica
// ==========================================


export function aggregateFunction_Sum_BlockDefinition(Blockly) {
  return buildAggregateInit(
    Blockly,
    'SUM(',["Expression", "Column", "DistinctExpression"],
    'Suma de valores. Click derecho para agregar DISTINCT.'
  );

}

export const SUM_GENERATOR = function(block, generator) {
  const distinct = block.getField('DISTINCT').isVisible() ? 'DISTINCT ' : '';
  const column = block.getFieldValue('COLUMN');
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC);
  const code = next
    ? 'SUM(' +distinct + column + '), ' + next
    : 'SUM(' +distinct + column + ')';
  return [code, generator.ORDER_ATOMIC]; //cambiado de ORDER_FUNCTION_CALL a ORDER_ATOMIC para evitar paréntesis innecesarios en casos simples
};

// ==========================================
// AVG - Actualizado, ahora DISTINCT es un campo que se muestra/oculta en el mismo bloque, y se agregó el input NEXT para permitir encadenar agregados con coma dinámica
// ==========================================
export function aggregateFunction_Avg_BlockDefinition(Blockly) {
  return buildAggregateInit(
    Blockly,
    'AVG(',
    ["Expression", "Column", "DistinctExpression"],
    'Promedio de valores. Click derecho para agregar DISTINCT.'
  );
}

export const AVG_GENERATOR = function(block, generator) {
  const distinct = block.getField('DISTINCT').isVisible() ? 'DISTINCT ' : '';
  const column = block.getFieldValue('COLUMN');
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC);
  // const code = next ? 'AVG(' + expression + '), ' + next : 'AVG(' + expression + ')';
  const code = next
    ? 'AVG(' + distinct + column + '), ' + next
    : 'AVG(' + distinct + column + ')';
  return [code, generator.ORDER_ATOMIC]; //cambiado de ORDER_FUNCTION_CALL a ORDER_ATOMIC para evitar paréntesis innecesarios en casos simples
};

// ==========================================
// COUNT - Actualizado, ahora DISTINCT es un campo que se muestra/oculta en el mismo bloque, y se agregó el input NEXT para permitir encadenar agregados con coma dinámica
// ==========================================
export function aggregateFunction_Count_BlockDefinition(Blockly) {
  return buildAggregateInit(
    Blockly,
    'COUNT(',
    ["Expression", "Column", "DistinctExpression"],
    'Conteo de filas. Click derecho para agregar DISTINCT.'
  );
}

export const COUNT_GENERATOR = function(block, generator) {
  const distinct = block.getField('DISTINCT').isVisible() ? 'DISTINCT ' : '';
  const column = block.getFieldValue('COLUMN');
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC);
  const code = next
    ? 'COUNT(' + distinct + column + '), ' + next
    : 'COUNT(' + distinct + column + ')';
  return [code, generator.ORDER_ATOMIC]; //cambiado de ORDER_FUNCTION_CALL a ORDER_ATOMIC para evitar paréntesis innecesarios en casos simples
};

// ==========================================
// MIN - Actualizado, ahora DISTINCT es un campo que se muestra/oculta en el mismo bloque, y se agregó el input NEXT para permitir encadenar agregados con coma dinámica
// ==========================================
export function aggregateFunction_Min_BlockDefinition(Blockly) {
  return buildAggregateInit(
    Blockly,
    'MIN(',
    ["Expression", "Column"],
    'Valor mínimo.'
  );

}

export const MIN_GENERATOR = function(block, generator) {
  const column = block.getFieldValue('COLUMN');
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC);
  const code = next
    ? 'MIN(' + column + '), ' + next
    : 'MIN(' + column + ')';
  return [code, generator.ORDER_ATOMIC]; //cambiado de ORDER_FUNCTION_CALL a ORDER_ATOMIC para evitar paréntesis innecesarios en casos simples
};

// ==========================================
// MAX (no acepta DISTINCT) - Actualizado, ahora DISTINCT es un campo que se muestra/oculta en el mismo bloque, y se agregó el input NEXT para permitir encadenar agregados con coma dinámica
// ==========================
export function aggregateFunction_Max_BlockDefinition(Blockly) {
  return buildAggregateInit(
    Blockly,
    'MAX(',
    ["Expression", "Column"],
    'Valor máximo.'
  );
}

export const MAX_GENERATOR = function(block, generator) {
  const column = block.getFieldValue('COLUMN');
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC);
  const code = next
    ? 'MAX(' + column + '), ' + next
    : 'MAX(' + column + ')';
  return [code, generator.ORDER_ATOMIC]; //cambiado de ORDER_FUNCTION_CALL a ORDER_ATOMIC para evitar paréntesis innecesarios en casos simples
};