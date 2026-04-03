// sqla-app/src/js/blocks/dml_AggregateFunctionsBlock.js
// Funciones de agregación: SUM, AVG, COUNT, MIN, MAX
// Vienen con Expression pre-conectada y solo aceptan DISTINCT (no TOP)
// MEJORADO: Con encadenamiento lateral (NEXT) y coma dinámica

// ==========================================
// Onchange compartido para todos los aggregate blocks
// Muestra/oculta la coma según NEXT esté conectado o no.
// Registrarlo en el generador de bloques en appController.js
// ==========================================

export function createAggregateFunctionOnChange(Blockly) { //Cambió de AGGREGATE_FUNCTION_ONCHANGE a createAggregateFunctionOnChange, ahora es una función que recibe Blockly y devuelve el onChange handler, para evitar dependencias circulares con la extensión del menú contextual que también necesita este onChange para el soporte de coma dinámica en HAVING
  return function (event) {
    if (event.type !== 'move' && event.type !== 'change') return;
    if (event.blockId !== this.id) return;

    const parent = this.getParent();
    const grandParent = parent?.getParent();
    const isInHaving =
      parent?.type === 'sql_having' ||
      grandParent?.type === 'sql_having';

    const isHavingVariant = this.type.endsWith('_having');

    if (isInHaving && isHavingVariant) return;
    if (!isInHaving && !isHavingVariant) {
      const nextInput = this.getInput('NEXT');
      if (!nextInput) return;
      const isConnected = nextInput.connection?.isConnected();
      if (isConnected && !this.getField('COMMA')) {
        nextInput.appendField(',', 'COMMA');
      }
      if (!isConnected && this.getField('COMMA')) {
        nextInput.removeField('COMMA');
      }
      return;
    }

    // Capturar todo el estado ANTES del setTimeout
    const column = this.getFieldValue('COLUMN') || 'columna';
    const distinctVisible = this.getField('DISTINCT')?.isVisible() ?? false;
    const currentColour = distinctVisible ? 230 : 120;
    const baseType = isHavingVariant
      ? this.type.replace('_having', '')
      : this.type + '_having';
    const outputConn = this.outputConnection;
    const parentConn = outputConn?.targetConnection ?? null;
    const position = this.getRelativeToSurfaceXY(); // ← capturar posición
    const workspace = this.workspace;

    // Diferir el reemplazo fuera del ciclo del gesture
    setTimeout(() => {
      if (this.isDeadOrDying()) return; // ya fue dispuesto

      // No reemplazar si el bloque está siendo arrastrado actualmente
      if (workspace.isDragging()) return;

      Blockly.Events.setGroup(true);
      try {
        if (parentConn) outputConn.disconnect();
        this.dispose(false);

        const newBlock = workspace.newBlock(baseType);
        newBlock.initSvg();
        newBlock.render();

        newBlock.setFieldValue(column, 'COLUMN');
        if (distinctVisible) {
          newBlock.getField('DISTINCT').setVisible(true);
          newBlock.setColour(currentColour);
        }

        if (parentConn) {
          parentConn.connect(newBlock.outputConnection);
        } else {
          // Sin padre — posicionar donde estaba el bloque original
          newBlock.moveBy(position.x, position.y);
        }
      } catch (e) {
        console.error('Error al reemplazar bloque de agregación:', e);
      } finally {
        Blockly.Events.setGroup(false);
      }
    }, 0);
  };
}

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
      Blockly.Extensions.apply('order_by_expression_extension', this, false);
    }
  };
}

// ==========================================
// Helper para variante HAVING — sin NEXT, bloque cerrado
// ==========================================
function buildAggregateHavingInit(Blockly, label, tooltip) {
  return {
    init: function () {
      this.appendDummyInput('LABEL')
        .appendField(label)
        .appendField(new Blockly.FieldLabel('DISTINCT'), 'DISTINCT')
        .appendField(new Blockly.FieldTextInput('columna'), 'COLUMN')
        .appendField(')');
      this.setInputsInline(false);
      this.setOutput(true, ["Aggregate", "Expression"]);
      this.setColour(120);
      this.setTooltip(tooltip);
      this.setHelpUrl('');

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
    'SUM(', ["Expression", "Column", "DistinctExpression"],
    'Suma de valores. Click derecho para agregar DISTINCT.'
  );

}

export const SUM_GENERATOR = function (block, generator) {
  const distinct = block.getField('DISTINCT').isVisible() ? 'DISTINCT ' : '';
  const column = block.getFieldValue('COLUMN');
  const direction = block.getFieldValue('DIRECTION');
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC);
  const self = direction
    ? `SUM(${distinct}${column}) ${direction}`
    : `SUM(${distinct}${column})`;
  // const code = next
  //   ? 'SUM(' +distinct + column + '), ' + next
  //   : 'SUM(' +distinct + column + ')';
  // return [code, generator.ORDER_ATOMIC]; //cambiado de ORDER_FUNCTION_CALL a ORDER_ATOMIC para evitar paréntesis innecesarios en casos simples
  return [next ? `${self}, ${next}` : self, generator.ORDER_ATOMIC];

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

export const AVG_GENERATOR = function (block, generator) {
  const distinct = block.getField('DISTINCT').isVisible() ? 'DISTINCT ' : '';
  const column = block.getFieldValue('COLUMN');
  const direction = block.getFieldValue('DIRECTION');
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC);
  // const code = next ? 'AVG(' + expression + '), ' + next : 'AVG(' + expression + ')';
  // const code = next
  //   ? 'AVG(' + distinct + column + '), ' + next
  //   : 'AVG(' + distinct + column + ')';
  // return [code, generator.ORDER_ATOMIC]; //cambiado de ORDER_FUNCTION_CALL a ORDER_ATOMIC para evitar paréntesis innecesarios en casos simples
  const self = direction
    ? `AVG(${distinct}${column}) ${direction}`
    : `AVG(${distinct}${column})`;
  return [next ? `${self}, ${next}` : self, generator.ORDER_ATOMIC];
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

export const COUNT_GENERATOR = function (block, generator) {
  const distinct = block.getField('DISTINCT').isVisible() ? 'DISTINCT ' : '';
  const column = block.getFieldValue('COLUMN');
  const direction = block.getFieldValue('DIRECTION');
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC);
  // const code = next
  //   ? 'COUNT(' + distinct + column + '), ' + next
  //   : 'COUNT(' + distinct + column + ')';
  // return [code, generator.ORDER_ATOMIC]; //cambiado de ORDER_FUNCTION_CALL a ORDER_ATOMIC para evitar paréntesis innecesarios en casos simples
  const self = direction
    ? `COUNT(${distinct}${column}) ${direction}`
    : `COUNT(${distinct}${column})`;
  return [next ? `${self}, ${next}` : self, generator.ORDER_ATOMIC];
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

export const MIN_GENERATOR = function (block, generator) {
  const column = block.getFieldValue('COLUMN');
  const direction = block.getFieldValue('DIRECTION');
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC);
  // const code = next
  //   ? 'MIN(' + column + '), ' + next
  //   : 'MIN(' + column + ')';
  // return [code, generator.ORDER_ATOMIC]; //cambiado de ORDER_FUNCTION_CALL a ORDER_ATOMIC para evitar paréntesis innecesarios en casos simples
  const self = direction
    ? `MIN(${column}) ${direction}`
    : `MIN(${column})`;
  return [next ? `${self}, ${next}` : self, generator.ORDER_ATOMIC];
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

export const MAX_GENERATOR = function (block, generator) {
  const column = block.getFieldValue('COLUMN');
  const direction = block.getFieldValue('DIRECTION');
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC);
  // const code = next
  //   ? 'MAX(' + column + '), ' + next
  //   : 'MAX(' + column + ')';
  // return [code, generator.ORDER_ATOMIC]; //cambiado de ORDER_FUNCTION_CALL a ORDER_ATOMIC para evitar paréntesis innecesarios en casos simples
  const self = direction
    ? `MAX(${column}) ${direction}`
    : `MAX(${column})`;
  return [next ? `${self}, ${next}` : self, generator.ORDER_ATOMIC];
};

// ==========================================
// SUM HAVING
// ==========================================
export function aggregateFunction_Sum_Having_BlockDefinition(Blockly) {
  return buildAggregateHavingInit(
    Blockly,
    'SUM(',
    'Suma de valores en HAVING. Click derecho para agregar DISTINCT o comparación.'
  );
}

export const SUM_HAVING_GENERATOR = function (block, generator) {
  const distinct = block.getField('DISTINCT').isVisible() ? 'DISTINCT ' : '';
  const column = block.getFieldValue('COLUMN') || '*';
  return ['SUM(' + distinct + column + ')', generator.ORDER_ATOMIC];
};

// ==========================================
// AVG HAVING
// ==========================================
export function aggregateFunction_Avg_Having_BlockDefinition(Blockly) {
  return buildAggregateHavingInit(
    Blockly,
    'AVG(',
    'Promedio de valores en HAVING. Click derecho para agregar DISTINCT o comparación.'
  );
}

export const AVG_HAVING_GENERATOR = function (block, generator) {
  const distinct = block.getField('DISTINCT').isVisible() ? 'DISTINCT ' : '';
  const column = block.getFieldValue('COLUMN') || '*';
  return ['AVG(' + distinct + column + ')', generator.ORDER_ATOMIC];
};

// ==========================================
// COUNT HAVING
// ==========================================
export function aggregateFunction_Count_Having_BlockDefinition(Blockly) {
  return buildAggregateHavingInit(
    Blockly,
    'COUNT(',
    'Conteo de filas en HAVING. Click derecho para agregar DISTINCT o comparación.'
  );
}

export const COUNT_HAVING_GENERATOR = function (block, generator) {
  const distinct = block.getField('DISTINCT').isVisible() ? 'DISTINCT ' : '';
  const column = block.getFieldValue('COLUMN') || '*';
  return ['COUNT(' + distinct + column + ')', generator.ORDER_ATOMIC];
};

// ==========================================
// MIN HAVING — no acepta DISTINCT
// ==========================================
export function aggregateFunction_Min_Having_BlockDefinition(Blockly) {
  return buildAggregateHavingInit(
    Blockly,
    'MIN(',
    'Valor mínimo en HAVING. Click derecho para agregar comparación.'
  );
}

export const MIN_HAVING_GENERATOR = function (block, generator) {
  const column = block.getFieldValue('COLUMN') || '*';
  return ['MIN(' + column + ')', generator.ORDER_ATOMIC];
};

// ==========================================
// MAX HAVING — no acepta DISTINCT
// ==========================================
export function aggregateFunction_Max_Having_BlockDefinition(Blockly) {
  return buildAggregateHavingInit(
    Blockly,
    'MAX(',
    'Valor máximo en HAVING. Click derecho para agregar comparación.'
  );
}

export const MAX_HAVING_GENERATOR = function (block, generator) {
  const column = block.getFieldValue('COLUMN') || '*';
  return ['MAX(' + column + ')', generator.ORDER_ATOMIC];
};