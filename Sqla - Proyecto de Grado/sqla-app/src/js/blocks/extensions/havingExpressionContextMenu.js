// sqla-app/src/js/blocks/extensions/havingExpressionContextMenu.js

import * as Blockly from 'blockly';

const COMPARISON_TYPES = ['sql_comparison', 'sql_quantified_comparison', 'sql_membership'];

// Detecta si el bloque está dentro de HAVING (directo o un nivel arriba via wrapper)
function getHavingParent(block) {
  const parent = block.getParent();
  if (!parent) return null;
  if (parent.type === 'sql_having') return parent;
  // Un nivel más arriba (ej: expression_single dentro de comparison dentro de having)
  const grandParent = parent.getParent();
  if (grandParent && grandParent.type === 'sql_having') return grandParent;
  return null;
}

// Detecta si el bloque ya está envuelto en un bloque de comparación
function getComparisonWrapper(block) {
  const parent = block.getParent();
  if (!parent) return null;
  if (COMPARISON_TYPES.includes(parent.type)) return parent;
  return null;
}

export function registerHavingExpressionContextMenu() {

  Blockly.Extensions.register('having_expression_context_menu', function () {

    this.customContextMenu = function (options) {
      const block = this;
      const workspace = block.workspace;

      if (!workspace || workspace.isFlyout) return;

      const havingParent = getHavingParent(block);
      if (!havingParent) return; // Solo mostrar si está dentro de HAVING

      const comparisonWrapper = getComparisonWrapper(block);

      // Separador visual
      options.push({
        text: '─'.repeat(20),
        enabled: false,
        callback: function () { }
      });

      // Helper para crear un wrapper de comparación
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

              // Conectar el bloque LEFT del comparison
              const leftInput = compBlock.getInput('LEFT').connection;
              leftInput.connect(blockOutput);

              // Auto-insertar ExpressionSingle en RIGHT
              const rightBlock = workspace.newBlock('sql_expression_single');
              rightBlock.initSvg();
              rightBlock.render();
              compBlock.getInput('RIGHT').connection.connect(rightBlock.outputConnection);

              // Conectar el comparison al HAVING
              parentConnection.connect(compBlock.outputConnection);

              // const blockXY = block.getRelativeToSurfaceXY();
              // compBlock.moveBy(blockXY.x - 20, blockXY.y - 10);

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
        // Mostrar las tres opciones de Add
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
        // Ya tiene un wrapper — mostrar tipo actual y opción de quitar
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
              const wrapper = comparisonWrapper;
              const wrapperOutput = wrapper.outputConnection;
              const grandParentConn = wrapperOutput?.targetConnection;

              if (grandParentConn) {
                wrapperOutput.disconnect();
                block.outputConnection.disconnect();
                grandParentConn.connect(block.outputConnection);
                wrapper.dispose();
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