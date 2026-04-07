// sqla-app/src/js/blocks/dml_selectBlock.js
// SOLO EXPORTA: La forma (función init) y el generador
//
// [Orden de cláusulas DML]
// previousStatement: false              → SELECT es bloque raíz, no tiene predecesor
// nextStatement:     "SQL_AFTER_SELECT" → después de SELECT solo puede ir FROM
//
// cambió de SELECT_DEFINITION a selectBlockDefinition para poder usar init y hacerlo compatible con la extensión selectContextMenu
export function selectBlockDefinition(Blockly) {
  return {
    init: function () {
      this.appendValueInput('EXPR0')
        .setCheck(['Expression', 'Column', 'Aggregate', 'DistinctFlag', 'TopFlag'])
        .appendField('SELECT');
      this.setInputsInline(false);
      this.setPreviousStatement(false);
      this.setNextStatement(true, 'SQL_AFTER_SELECT');
      this.setColour(160);
      this.setTooltip('Instrucción SELECT. Click derecho para agregar DISTINCT o TOP');
      this.setHelpUrl('');
      Blockly.Extensions.apply('select_context_menu', this, false);
    },
    onchange: function (event) {
      // Solo reaccionar a conexiones/desconexiones
      if (event.type !== Blockly.Events.BLOCK_MOVE &&
        event.type !== Blockly.Events.BLOCK_DRAG) return;

      const workspace = this.workspace;
      if (!workspace || workspace.isFlyout) return;

      const expr0Conn = this.getInput('EXPR0')?.connection;
      const chainRoot = expr0Conn?.targetConnection?.sourceBlock_;
      if (!chainRoot) return;

      // Recorrer la cadena buscando aggregates (saltando distinct/top)
      const AGGREGATE_TYPES = ['sql_sum', 'sql_avg', 'sql_count', 'sql_min', 'sql_max'];

      function chainHasAggregate(block) {
        let current = block;
        while (current) {
          if (AGGREGATE_TYPES.includes(current.type)) return true;
          current = current.getInput('NEXT')?.connection?.targetConnection?.sourceBlock_;
        }
        return false;
      }

      // Determinar si hay flags y encontrar el primer bloque real de expresión
      const hasDistinct = chainRoot.type === 'sql_distinct';
      const hasTop = chainRoot.type === 'sql_top' ||
        (hasDistinct && chainRoot.getInput('NEXT')
          ?.connection?.targetConnection?.sourceBlock_?.type === 'sql_top');

      if (!hasDistinct && !hasTop) return; // Sin flags, nada que limpiar

      // Encontrar el bloque de expresión real (después de los flags)
      let exprRoot = chainRoot;
      while (exprRoot && (exprRoot.type === 'sql_distinct' || exprRoot.type === 'sql_top')) {
        exprRoot = exprRoot.getInput('NEXT')?.connection?.targetConnection?.sourceBlock_;
      }

      if (!exprRoot || !chainHasAggregate(exprRoot)) return; // Sin aggregates, nada que hacer

      // Auto-eliminar flags
      Blockly.Events.setGroup(true);
      try {
        let current = chainRoot;
        while (current && (current.type === 'sql_distinct' || current.type === 'sql_top')) {
          const nextBlock = current.getInput('NEXT')
            ?.connection?.targetConnection?.sourceBlock_;
          current.getInput('NEXT').connection.disconnect();
          current.dispose();
          current = nextBlock;
        }
        if (current) {
          expr0Conn.connect(current.outputConnection);
        }
      } catch (e) {
        console.error('Error en auto-eliminación de flags:', e);
      } finally {
        Blockly.Events.setGroup(false);
      }
    }
  };
}

export const SELECT_GENERATOR = function (block, generator) {
  const expr = generator.valueToCode(block, 'EXPR0', generator.ORDER_ATOMIC);
  if (!expr) return 'SELECT *\n';

  // Leer flags opcionales — solo si el input existe en el bloque
  // const distinctInput = block.getInput('DISTINCT_INPUT');
  // const topInput = block.getInput('TOP_INPUT');

  // const distinctBlock = distinctInput?.connection?.targetConnection?.sourceBlock_;
  // const topBlock = topInput?.connection?.targetConnection?.sourceBlock_;

  // const distinctCode = distinctBlock ? generator.valueToCode(block, 'DISTINCT_INPUT', generator.ORDER_ATOMIC) : '';
  // const topCode = topBlock ? generator.valueToCode(block, 'TOP_INPUT', generator.ORDER_ATOMIC) : '';

  // Orden garantizado: SELECT [DISTINCT] [TOP (n)]
  // const parts = ['SELECT', distinctCode, topCode].filter(Boolean);
  // return `${parts.join(' ')}\n  ${expr}\n`;

  if (!expr) return 'SELECT *\n';
  return `SELECT\n  ${expr}\n`;
};