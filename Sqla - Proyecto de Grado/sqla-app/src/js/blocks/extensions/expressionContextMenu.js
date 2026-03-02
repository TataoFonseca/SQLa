// sqla-app/src/js/blocks/extensions/expressionContextMenu.js
// Extensión para agregar menú contextual a Expression blocks

import * as Blockly from 'blockly';

/**
 * Registra la extensión del menú contextual
 * Debe llamarse después de importar Blockly
 */

const AGGREGATE_TYPES = ['sql_sum', 'sql_avg', 'sql_count', 'sql_min', 'sql_max']; // Tipos de bloques de agregación para validar, al agregar uno antes o despues, las opciones de DISTINCT/TOP se deben deshabilitar

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

      // Detectar posición en la cadena de bloques para determinar si puede o no poner DISTINCT o TOP
      const isFirstInChain = parentBlock && parentBlock.type === 'sql_select';
      const isInChain = parentBlock && (
      parentBlock.type === 'sql_expression' || 
      AGGREGATE_TYPES.includes(parentBlock.type)
      );

      // Detectar si está adyacente a un aggregate (para deshabilitar DISTINCT/TOP)
      const connectedToBlock = block.getParent();
      const parentIsAggregate = connectedToBlock && AGGREGATE_TYPES.includes(connectedToBlock.type);
      const nextBlock = block.getInput('NEXT')?.connection?.targetConnection?.sourceBlock_;
      const nextIsAggregate = nextBlock && AGGREGATE_TYPES.includes(nextBlock.type);
      const isAdjacentToAggregate = parentIsAggregate || nextIsAggregate; // Si expression es adyacente a un bloque de agregación, deshabilitar opciones de DISTINCT/TOP


      console.log('Nuevos logs para debugging:');
      console.log('outputConnection:', block.outputConnection);
      console.log('targetConnection:', block.outputConnection?.targetConnection);
      console.log('sourceBlock_:', block.outputConnection?.targetConnection?.sourceBlock_);
      console.log('getParent():', block.getParent()?.type);
      console.log('getSurroundParent():', block.getSurroundParent()?.type);

      // const ni = block.getInput('NEXT');
    
      // Separador visual
      options.push({
        text: '─'.repeat(20),
        enabled: false,
        callback: function() {}
      });

      
      // ==========================================
      // INFO: Por al usuario del porqué están deshabilitados 
      // ==========================================
      if (isAdjacentToAggregate) {
        options.push({
          text: '⚠️ DISTINCT/TOP no aplican junto a funciones de agregación',
          enabled: false,
          callback: function() {}
        });
        return; // No mostrar opciones de DISTINCT/TOP si Expression está junto a un bloque de agregación
      }

      // ==========================================
      // CASO: En cadena pero no es el primero → aviso
      // ==========================================
      if (isInChain) {
        options.push({
          text: 'DISTINCT/TOP se controlan desde la primera expresión',
          enabled: false,
          callback: function() {}
        });
        return;
      }
      
      // ==========================================
      // CASO: Expression suelta o primera en cadena
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
