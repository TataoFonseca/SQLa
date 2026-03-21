// sqla-app/src/js/blocks/extensions/selectContextMenu.js 
// RENOMBRADO de expressionContextMenu.js a selectContextMenu.js
// Extensión para agregar menú contextual a Expression blocks

import * as Blockly from 'blockly';

/**
 * Registra la extensión del menú contextual
 * Debe llamarse después de importar Blockly
 */

const AGGREGATE_TYPES = ['sql_sum', 'sql_avg', 'sql_count', 'sql_min', 'sql_max']; // Tipos de bloques de agregación para validar, al agregar uno antes o despues, las opciones de DISTINCT/TOP se deben deshabilitar

// Recorre la cadena buscando un bloque por tipo
function findInChain(block, type) {
  let current = block;
  while (current) {
    if (current.type === type) return current;
    current = current.getInput('NEXT')?.connection?.targetConnection?.sourceBlock_;
  }
  return null;
}

// Devuelve el bloque raíz de la cadena conectada a EXPR0
function getChainRoot(selectBlock) {
  return selectBlock.getInput('EXPR0')?.connection?.targetConnection?.sourceBlock_;
}

// Recorre la cadena NEXT buscando aggregates
function chainHasAggregate(block) {
  let current = block;
  while (current) {
    if (AGGREGATE_TYPES.includes(current.type)) return true;
    current = current.getInput('NEXT')?.connection?.targetConnection?.sourceBlock_;
  }
  return false;
}

export function registerSelectContextMenu() {

  Blockly.Extensions.register('select_context_menu', function () {

    this.customContextMenu = function (options) {
      const block = this;
      const workspace = block.workspace;

      if (!workspace || workspace.isFlyout) return;

      const expr0Conn = block.getInput('EXPR0').connection;
      const chainRoot = getChainRoot(block);

      options.push({
        text: '─'.repeat(20),
        enabled: false,
        callback: function () { }
      });

      if (!chainRoot) {
        options.push({
          text: 'Conecta una expresión primero',
          enabled: false,
          callback: function () { }
        });
        return;
      }

      const hasDistinct = chainRoot.type === 'sql_distinct';
      const hasTop = chainRoot.type === 'sql_top' ||
        (hasDistinct && chainRoot.getInput('NEXT')
          ?.connection?.targetConnection?.sourceBlock_?.type === 'sql_top');

      // Bloque de expresión real (saltando distinct/top si existen)
      const exprRoot = hasDistinct
        ? (hasTop
          ? chainRoot.getInput('NEXT')?.connection?.targetConnection?.sourceBlock_
            ?.getInput('NEXT')?.connection?.targetConnection?.sourceBlock_
          : chainRoot.getInput('NEXT')?.connection?.targetConnection?.sourceBlock_)
        : (hasTop
          ? chainRoot.getInput('NEXT')?.connection?.targetConnection?.sourceBlock_
          : chainRoot);

      const hasAggregate = exprRoot ? chainHasAggregate(exprRoot) : false;

      // ==========================================
      // AUTO-ELIMINAR distinct/top si hay aggregates
      // ==========================================
      if (hasAggregate && (hasDistinct || hasTop)) {
        Blockly.Events.setGroup(true);
        try {
          // Encontrar el primer bloque de expresión real en la cadena
          let current = chainRoot;
          while (current && (current.type === 'sql_distinct' || current.type === 'sql_top')) {
            const nextBlock = current.getInput('NEXT')
              ?.connection?.targetConnection?.sourceBlock_;
            current.getInput('NEXT').connection.disconnect();
            current.dispose();
            current = nextBlock;
          }
          // Reconectar el bloque de expresión directamente a SELECT
          if (current) {
            expr0Conn.connect(current.outputConnection);
          }
        } catch (e) {
          console.error('Error al auto-eliminar flags:', e);
        } finally {
          Blockly.Events.setGroup(false);
        }

        options.push({
          text: '⚠️ DISTINCT/TOP eliminados: hay funciones de agregación',
          enabled: false,
          callback: function () { }
        });
        return;
      }

      if (hasAggregate) {
        options.push({
          text: '⚠️ DISTINCT/TOP no aplican cuando hay funciones de agregación',
          enabled: false,
          callback: function () { }
        });
        return;
      }

      // ==========================================
      // OPCIÓN: Add / Remove DISTINCT
      // ==========================================
      if (!hasDistinct) {
        options.push({
          text: '➕ Add DISTINCT',
          enabled: true,
          callback: function () {
            Blockly.Events.setGroup(true);
            try {
              const distinctBlock = workspace.newBlock('sql_distinct');
              distinctBlock.initSvg();
              distinctBlock.render();

              // Desconectar la cadena actual de SELECT
              const currentRoot = getChainRoot(block);
              if (currentRoot) expr0Conn.disconnect();

              // DISTINCT → lo que había antes en EXPR0
              if (currentRoot) {
                distinctBlock.getInput('NEXT').connection
                  .connect(currentRoot.outputConnection);
              }

              // SELECT → DISTINCT
              expr0Conn.connect(distinctBlock.outputConnection);

              distinctBlock.select();
            } catch (e) {
              console.error('Error al agregar DISTINCT:', e);
            } finally {
              Blockly.Events.setGroup(false);
            }
          }
        });
      } else {
        options.push({
          text: '❌ Remove DISTINCT',
          enabled: true,
          callback: function () {
            Blockly.Events.setGroup(true);
            try {
              const distinctBlock = chainRoot;
              const nextBlock = distinctBlock.getInput('NEXT')
                ?.connection?.targetConnection?.sourceBlock_;

              expr0Conn.disconnect();
              if (nextBlock) {
                distinctBlock.getInput('NEXT').connection.disconnect();
                expr0Conn.connect(nextBlock.outputConnection);
              }
              distinctBlock.dispose();
            } catch (e) {
              console.error('Error al quitar DISTINCT:', e);
            } finally {
              Blockly.Events.setGroup(false);
            }
          }
        });
      }

      // ==========================================
      // OPCIÓN: Add / Remove TOP
      // ==========================================
      if (!hasTop) {
        options.push({
          text: '➕ Add TOP',
          enabled: true,
          callback: function () {
            Blockly.Events.setGroup(true);
            try {
              const topBlock = workspace.newBlock('sql_top');
              topBlock.initSvg();
              topBlock.render();

              if (hasDistinct) {
                // Insertar TOP entre DISTINCT y lo que sigue
                const distinctBlock = chainRoot;
                const afterDistinct = distinctBlock.getInput('NEXT')
                  ?.connection?.targetConnection?.sourceBlock_;

                if (afterDistinct) {
                  distinctBlock.getInput('NEXT').connection.disconnect();
                  topBlock.getInput('NEXT').connection
                    .connect(afterDistinct.outputConnection);
                }
                distinctBlock.getInput('NEXT').connection
                  .connect(topBlock.outputConnection);
              } else {
                // Insertar TOP entre SELECT y lo que sigue
                const currentRoot = getChainRoot(block);
                if (currentRoot) expr0Conn.disconnect();

                if (currentRoot) {
                  topBlock.getInput('NEXT').connection
                    .connect(currentRoot.outputConnection);
                }
                expr0Conn.connect(topBlock.outputConnection);
              }

              topBlock.select();
            } catch (e) {
              console.error('Error al agregar TOP:', e);
            } finally {
              Blockly.Events.setGroup(false);
            }
          }
        });
      } else {
        options.push({
          text: '❌ Remove TOP',
          enabled: true,
          callback: function () {
            Blockly.Events.setGroup(true);
            try {
              // Encontrar TOP en la cadena
              const topBlock = hasDistinct
                ? chainRoot.getInput('NEXT')?.connection?.targetConnection?.sourceBlock_
                : chainRoot;

              const beforeTop = hasDistinct ? chainRoot : null;
              const afterTop = topBlock.getInput('NEXT')
                ?.connection?.targetConnection?.sourceBlock_;

              // Desconectar TOP
              if (beforeTop) {
                beforeTop.getInput('NEXT').connection.disconnect();
              } else {
                expr0Conn.disconnect();
              }
              if (afterTop) topBlock.getInput('NEXT').connection.disconnect();

              // Reconectar lo que había después de TOP
              if (afterTop) {
                if (beforeTop) {
                  beforeTop.getInput('NEXT').connection
                    .connect(afterTop.outputConnection);
                } else {
                  expr0Conn.connect(afterTop.outputConnection);
                }
              }

              topBlock.dispose();
            } catch (e) {
              console.error('Error al quitar TOP:', e);
            } finally {
              Blockly.Events.setGroup(false);
            }
          }
        });
      }
    };
  });
}