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
    };
  });
}
