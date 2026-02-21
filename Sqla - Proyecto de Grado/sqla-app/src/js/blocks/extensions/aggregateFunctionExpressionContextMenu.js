// sqla-app/src/js/blocks/extensions/aggregateFunctionExpressionContextMenu.js
// Extensión para Expression dentro de funciones de agregación
// Solo permite DISTINCT, no TOP

import * as Blockly from 'blockly';

/**
 * Registra la extensión del menú contextual para expresiones dentro de agregaciones
 * Solo muestra la opción de DISTINCT (TOP no está permitido en agregaciones SQL)
 */
export function registerAggregateFunctionExpressionContextMenu() {
  
  Blockly.Extensions.register('aggregate_expression_context_menu', function() {
    
    this.customContextMenu = function(options) {
      const block = this;
      const workspace = block.workspace;
      
      if (!workspace || workspace.isFlyout) {
        return; // No mostrar en el flyout/toolbox
      }
      
      // Verificar si ya está dentro de un DISTINCT
      const parentBlock = block.getParent();
      const isInDistinct = parentBlock && parentBlock.type === 'sql_distinct';
      
      // Verificar que realmente está dentro de una función de agregación
      const isInAggregate = parentBlock && [
        'sql_sum', 
        'sql_avg', 
        'sql_count', 
        'sql_min', 
        'sql_max'
      ].includes(parentBlock.type);
      
      // Separador visual
      options.push({
        text: '─'.repeat(20),
        enabled: false,
        callback: function() {}
      });
      
      // ==========================================
      // OPCIÓN: + Add DISTINCT
      // ==========================================
      if (!isInDistinct) {
        options.push({
          text: '➕ Add DISTINCT',
          enabled: block.outputConnection && block.outputConnection.isConnected(),
          callback: function() {
            Blockly.Events.setGroup(true);
            
            try {
              // Crear el bloque DISTINCT
              const distinctBlock = workspace.newBlock('sql_distinct');
              distinctBlock.initSvg();
              distinctBlock.render();
              
              // Obtener conexiones
              const blockOutput = block.outputConnection;
              const parentConnection = blockOutput.targetConnection;
              
              if (parentConnection) {
                // Desconectar el bloque actual
                blockOutput.disconnect();
                
                // Conectar el bloque actual al input del DISTINCT
                const distinctInput = distinctBlock.getInput('EXPRESSION').connection;
                distinctInput.connect(blockOutput);
                
                // Conectar el DISTINCT al padre original (la función de agregación)
                parentConnection.connect(distinctBlock.outputConnection);
                
                // Posicionar el bloque DISTINCT cerca del bloque original
                const blockXY = block.getRelativeToSurfaceXY();
                distinctBlock.moveBy(blockXY.x - 20, blockXY.y - 10);
              }
              
              distinctBlock.select();
              
            } catch (e) {
              console.error('Error al crear DISTINCT:', e);
            } finally {
              Blockly.Events.setGroup(false);
            }
          }
        });
      } else {
        options.push({
          text: '✓ Ya está en DISTINCT',
          enabled: false,
          callback: function() {}
        });
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
      // OPCIÓN: Remove DISTINCT (si existe)
      // ==========================================
      if (isInDistinct) {
        options.push({
          text: '❌ Remove DISTINCT',
          enabled: true,
          callback: function() {
            Blockly.Events.setGroup(true);
            
            try {
              const wrapperBlock = parentBlock;
              const wrapperOutput = wrapperBlock.outputConnection;
              const grandParentConnection = wrapperOutput ? wrapperOutput.targetConnection : null;
              
              if (grandParentConnection) {
                // Desconectar todo
                wrapperOutput.disconnect();
                block.outputConnection.disconnect();
                
                // Conectar el bloque directamente al abuelo (la función de agregación)
                grandParentConnection.connect(block.outputConnection);
                
                // Eliminar el wrapper DISTINCT
                wrapperBlock.dispose();
              }
              
            } catch (e) {
              console.error('Error al quitar DISTINCT:', e);
            } finally {
              Blockly.Events.setGroup(false);
            }
          }
        });
      }
    };
  });
}
