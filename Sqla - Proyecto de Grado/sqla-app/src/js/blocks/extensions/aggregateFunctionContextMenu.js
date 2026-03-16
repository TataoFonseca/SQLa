// sqla-app/src/js/blocks/extensions/aggregateFunctionContextMenu.js
// Renombrado de aggregateFunctionExpressionContextMenu.js a aggregateFunctionContextMenu.js
// El bloque dml_aggregateFunctionsExpressionBlock.js deja de existir, el menu contextual se manitene pero ahora cambia a un flag DISTINCT dentro del bloque de función de agregación (dml_aggregateFunctionsBlock.js) en lugar de envolver la expresión con un bloque DISTINCT, esto simplifica la estructura y el código generado.
// Extensión para Expression dentro de funciones de agregación.
// Solo permite DISTINCT, no TOP.

import * as Blockly from 'blockly';
/**
 * Registra la extensión del menú contextual para las funciones de agregación (SUM, AVG, COUNT, MIN, MAX).
 * Solo muestra la opción de DISTINCT (TOP no está permitido en agregaciones SQL)
 */

const AGGREGATE_TYPES_NO_DISTINCT = ['sql_min', 'sql_max'];
const COMPARISON_TYPES = ['sql_comparison', 'sql_quantified_comparison', 'sql_membership'];

function getHavingParent(block) {
  const parent = block.getParent();
  if (!parent) return null;
  if (parent.type === 'sql_having') return parent;
  const grandParent = parent.getParent();
  if (grandParent && grandParent.type === 'sql_having') return grandParent;
  return null;
}

function getComparisonWrapper(block) {
  const parent = block.getParent();
  if (!parent) return null;
  if (COMPARISON_TYPES.includes(parent.type)) return parent;
  return null;
}

export function registerAggregateFunctionContextMenu() {
  
  Blockly.Extensions.register('aggregate_functions_context_menu', function() {
    
    this.customContextMenu = function(options) {
      const block = this;
      const workspace = block.workspace;
      
      if (!workspace || workspace.isFlyout) {
        return; // No mostrar en el flyout/toolbox
      }
      
      // Verificar si ya está con DISTINCT
      const distinctField = block.getField('DISTINCT');
      const distinctVisible = distinctField && distinctField.isVisible();
      const noDistinct = AGGREGATE_TYPES_NO_DISTINCT.includes(block.type);
      const havingParent = getHavingParent(block);
      const comparisonWrapper = getComparisonWrapper(block);

      
      // Verificar que realmente está dentro de una función de agregación
      // const isInAggregate = parentBlock && [
      //   'sql_sum', 
      //   'sql_avg', 
      //   'sql_count', 
      //   'sql_min', 
      //   'sql_max'
      // ].includes(parentBlock.type);
      
      // Separador visual
      options.push({
        text: '─'.repeat(20),
        enabled: false,
        callback: function() {}
      });

      // ==========================================
      // MIN / MAX — DISTINCT no aplica
      // ==========================================
      if (noDistinct) {
        options.push({
          text: '⚠️ DISTINCT no aplica para ' + block.type.replace('sql_', '').toUpperCase(),
          enabled: false,
          callback: function() {}
        });
        return;
      }

      // ==========================================
      // INFO: TOP no permitido en agregaciones
      // ==========================================
      options.push({
        text: '⚠️ TOP no permitido en agregaciones',
        enabled: false,
        callback: function() {}
      });
      
      // ==========================================
      // OPCIÓN: + Add DISTINCT
      // ==========================================
      if (!distinctVisible){
        options.push({
          text: '➕ Add DISTINCT',
          enabled: true,
          callback: function() {
            distinctField.setVisible(true);
            block.setColour(230);
            block.render();
          }
        });
      } else {
        options.push({
          text: '✓ DISTINCT ya está activo',
          enabled: false,
          callback: function() {}
        });
      }
      
      // ==========================================
      // OPCIÓN: Remove DISTINCT (si existe)
      // ==========================================
      // if (isInDistinct) 
      if (distinctVisible){
        options.push({
          text: '❌ Remove DISTINCT',
          enabled: true,
          callback: function() {
            distinctField.setVisible(false);
            block.setColour(120);
            block.render();
          }
        });
      }

      // ==========================================
      // SECCIÓN HAVING — solo si está dentro de HAVING
      // ==========================================
      if (!havingParent) return;

      options.push({
        text: '─'.repeat(20),
        enabled: false,
        callback: function () { }
      });

      function wrapWithComparison(compType) {
        return function () {
          Blockly.Events.setGroup(true);
          try {
            const compBlock = workspace.newBlock(compType);
            compBlock.initSvg();
            compBlock.render();

            const blockOutput = block.outputConnection;
            const parentConnection = blockOutput.targetConnection;

            if (parentConnection) {
              blockOutput.disconnect();

              compBlock.getInput('LEFT').connection.connect(blockOutput);

              const rightBlock = workspace.newBlock('sql_expression_single');
              rightBlock.initSvg();
              rightBlock.render();
              compBlock.getInput('RIGHT').connection.connect(rightBlock.outputConnection);

              parentConnection.connect(compBlock.outputConnection);
            }

            compBlock.select();
          } catch (e) {
            console.error('Error al crear comparación:', e);
          } finally {
            Blockly.Events.setGroup(false);
          }
        };
      }

      if (!comparisonWrapper) {
        options.push({
          text: '➕ Add COMPARISON',
          enabled: block.outputConnection && block.outputConnection.isConnected(),
          callback: wrapWithComparison('sql_comparison')
        });
        options.push({
          text: '➕ Add QUANTIFIED COMPARISON',
          enabled: block.outputConnection && block.outputConnection.isConnected(),
          callback: wrapWithComparison('sql_quantified_comparison')
        });
        options.push({
          text: '➕ Add MEMBERSHIP',
          enabled: block.outputConnection && block.outputConnection.isConnected(),
          callback: wrapWithComparison('sql_membership')
        });
      } else {
        options.push({
          text: `✓ Ya tiene ${comparisonWrapper.type.replace('sql_', '').toUpperCase()}`,
          enabled: false,
          callback: function () { }
        });
        options.push({
          text: '❌ Remove comparison',
          enabled: true,
          callback: function () {
            Blockly.Events.setGroup(true);
            try {
              const wrapperOutput = comparisonWrapper.outputConnection;
              const grandParentConn = wrapperOutput?.targetConnection;

              if (grandParentConn) {
                wrapperOutput.disconnect();
                block.outputConnection.disconnect();
                grandParentConn.connect(block.outputConnection);
                comparisonWrapper.dispose();
              }
            } catch (e) {
              console.error('Error al quitar comparación:', e);
            } finally {
              Blockly.Events.setGroup(false);
            }
          }
        });
      }
    };
  });
}
