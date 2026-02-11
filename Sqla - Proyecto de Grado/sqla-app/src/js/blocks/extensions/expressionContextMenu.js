// sqla-app/src/js/blocks/extensions/expressionContextMenu.js
// Extensión para agregar menú contextual a Expression blocks

import * as Blockly from 'blockly';

/**
 * Registra la extensión del menú contextual
 * Debe llamarse después de importar Blockly
 */
export function registerExpressionContextMenu() {
  
  Blockly.Extensions.register('expression_context_menu', function() {
    
    this.customContextMenu = function(options) {
      const block = this;
      const workspace = block.workspace;
      
      if (!workspace || workspace.isFlyout) {
        return; // No mostrar en el flyout/toolbox
      }
      
      // Verificar si ya está dentro de un DISTINCT o TOP
      const parentBlock = block.getParent();
      const isInDistinct = parentBlock && parentBlock.type === 'sql_distinct';
      const isInTop = parentBlock && parentBlock.type === 'sql_top';
      
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
                
                // Conectar el DISTINCT al padre original
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
      // OPCIÓN: + Add TOP
      // ==========================================
      if (!isInTop) {
        options.push({
          text: '➕ Add TOP',
          enabled: block.outputConnection && block.outputConnection.isConnected(),
          callback: function() {
            Blockly.Events.setGroup(true);
            
            try {
              // Crear el bloque TOP
              const topBlock = workspace.newBlock('sql_top');
              topBlock.initSvg();
              topBlock.render();
              
              // Obtener conexiones
              const blockOutput = block.outputConnection;
              const parentConnection = blockOutput.targetConnection;
              
              if (parentConnection) {
                // Desconectar el bloque actual
                blockOutput.disconnect();
                
                // Conectar el bloque actual al input del TOP
                const topInput = topBlock.getInput('EXPRESSION').connection;
                topInput.connect(blockOutput);
                
                // Conectar el TOP al padre original
                parentConnection.connect(topBlock.outputConnection);
                
                // Posicionar el bloque TOP cerca del bloque original
                const blockXY = block.getRelativeToSurfaceXY();
                topBlock.moveBy(blockXY.x - 20, blockXY.y - 10);
              }
              
              topBlock.select();
              
            } catch (e) {
              console.error('Error al crear TOP:', e);
            } finally {
              Blockly.Events.setGroup(false);
            }
          }
        });
      } else {
        options.push({
          text: '✓ Ya está en TOP',
          enabled: false,
          callback: function() {}
        });
      }
      
      // ==========================================
      // OPCIÓN: Unwrap (Quitar DISTINCT/TOP)
      // ==========================================
      if (isInDistinct || isInTop) {
        options.push({
          text: '❌ Remove ' + (isInDistinct ? 'DISTINCT' : 'TOP'),
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
                
                // Conectar el bloque directamente al abuelo
                grandParentConnection.connect(block.outputConnection);
                
                // Eliminar el wrapper
                wrapperBlock.dispose();
              }
              
            } catch (e) {
              console.error('Error al quitar wrapper:', e);
            } finally {
              Blockly.Events.setGroup(false);
            }
          }
        });
      }
    };
  });
}
