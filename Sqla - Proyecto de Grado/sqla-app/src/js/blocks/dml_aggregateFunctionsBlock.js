// sqla-app/src/js/blocks/dml_AggregateFunctionsBlock.js
//
// Define los bloques de funciones de agregación: SUM, AVG, COUNT, MIN, MAX,
// más sus variantes _having (sin encadenamiento ni ORDER BY).
//
// Bloques normales (SUM, AVG, COUNT, MIN, MAX):
//   - Se construyen con buildAggregateInit, que aplica dos extensiones en init:
//       · aggregate_functions_context_menu: menú contextual para DISTINCT.
//       · order_by_expression_extension: añade/quita el dropdown DIRECTION
//         (ASC/DESC) cuando el bloque entra o sale de un sql_order_by.
//   - Soportan encadenamiento lateral vía input NEXT con coma dinámica.
//   - Los generadores leen DIRECTION (si existe) y lo incluyen en el código SQL.
//
// Variantes _having (SUM_HAVING, AVG_HAVING, COUNT_HAVING, MIN_HAVING, MAX_HAVING):
//   - Se construyen con buildAggregateHavingInit: sin input NEXT, sin extensión
//     order_by_expression_extension y sin soporte de DIRECTION.
//   - Solo aplican aggregate_functions_context_menu para DISTINCT/comparación.

// ─── onChange compartido ──────────────────────────────────────────────────────
//
// Gestiona la coma dinámica del input NEXT y, cuando el bloque se mueve entre
// contextos (normal ↔ having), lo reemplaza por su variante equivalente.
//
// Se exporta como función factory (recibe Blockly y devuelve el handler) para
// evitar dependencias circulares con aggregateFunctionContextMenu, que también
// necesita este handler para el soporte de coma dinámica en HAVING.

export function createAggregateFunctionOnChange(Blockly) {
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

// ─── Helpers de construcción ──────────────────────────────────────────────────

// buildAggregateInit — plantilla para los bloques normales de agregación.
// Crea el input NEXT (encadenamiento lateral + coma dinámica), el campo DISTINCT
// (oculto por defecto, visible vía menú contextual) y el campo COLUMN.
// Aplica las dos extensiones necesarias para ORDER BY y el menú contextual.
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

// buildAggregateHavingInit — plantilla para las variantes HAVING.
// Sin input NEXT (no encadenable), sin order_by_expression_extension.
// Solo aplica aggregate_functions_context_menu para DISTINCT/comparación.
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


// ─── SUM ──────────────────────────────────────────────────────────────────────

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
  // DIRECTION solo existe si order_by_expression_extension lo inyectó (bloque dentro de ORDER BY).
  const direction = block.getFieldValue('DIRECTION');
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC);
  const self = direction
    ? `SUM(${distinct}${column}) ${direction}`
    : `SUM(${distinct}${column})`;
  return [next ? `${self}, ${next}` : self, generator.ORDER_ATOMIC];
};

// ─── AVG ──────────────────────────────────────────────────────────────────────

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
  const self = direction
    ? `AVG(${distinct}${column}) ${direction}`
    : `AVG(${distinct}${column})`;
  return [next ? `${self}, ${next}` : self, generator.ORDER_ATOMIC];
};

// ─── COUNT ────────────────────────────────────────────────────────────────────

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
  const self = direction
    ? `COUNT(${distinct}${column}) ${direction}`
    : `COUNT(${distinct}${column})`;
  return [next ? `${self}, ${next}` : self, generator.ORDER_ATOMIC];
};

// ─── MIN (no acepta DISTINCT) ─────────────────────────────────────────────────

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
  const self = direction
    ? `MIN(${column}) ${direction}`
    : `MIN(${column})`;
  return [next ? `${self}, ${next}` : self, generator.ORDER_ATOMIC];
};

// ─── MAX (no acepta DISTINCT) ─────────────────────────────────────────────────

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
  const self = direction
    ? `MAX(${column}) ${direction}`
    : `MAX(${column})`;
  return [next ? `${self}, ${next}` : self, generator.ORDER_ATOMIC];
};

// ─── Variantes HAVING ─────────────────────────────────────────────────────────
// Sin encadenamiento NEXT, sin soporte ORDER BY (no se aplica
// order_by_expression_extension). Los generadores son deliberadamente simples.

// SUM HAVING
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

// AVG HAVING
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

// COUNT HAVING
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

// MIN HAVING — no acepta DISTINCT
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

// MAX HAVING — no acepta DISTINCT
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