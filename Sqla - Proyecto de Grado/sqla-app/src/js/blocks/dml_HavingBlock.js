// sqla-app/src/js/blocks/dml_HavingBlock.js
// [Orden de cláusulas DML]
// previousStatement: "SQL_AFTER_GROUPBY" → HAVING solo puede ir después de GROUP BY
// nextStatement:     "SQL_AFTER_HAVING"  → después de HAVING: ORDER BY
//
// HAVING_ONCHANGE: cuando sql_expression se conecta directamente al input EXPRESSION
// de HAVING, lo transforma automáticamente en sql_expression_single. La lógica vive
// aquí (en HAVING) y no en ExpressionBlock porque HAVING conoce con certeza cuándo
// algo acaba de conectarse a su propio input: BLOCK_MOVE con event.newParentId === this.id.

import * as Blockly from 'blockly';

export const HAVING_DEFINITION = {
  "type": "sql_having",
  "message0": "HAVING %1",
  "args0": [
    {
      "type": "input_value",
      "name": "EXPRESSION",
      "check": ["Expression", "Column", "Aggregate", "Condition"]
    }
  ],
  "inputsInline": true,
  "previousStatement": "SQL_AFTER_GROUPBY",
  "nextStatement": "SQL_AFTER_HAVING",
  "colour": 200,
  "tooltip": "Filtra grupos después del GROUP BY. Conecta una Expression o función de agregación.",
  "helpUrl": ""
};

export const HAVING_GENERATOR = function(block, generator) {
  const expression = generator.valueToCode(block, 'EXPRESSION', generator.ORDER_ATOMIC);
  if (!expression) return '';
  return 'HAVING ' + expression + '\n';
};

// HAVING_ONCHANGE: detecta cuando sql_expression se conecta al input EXPRESSION
// de este bloque y lo reemplaza por sql_expression_single.
//
// Por qué BLOCK_MOVE con event.newParentId === this.id:
//   BLOCK_MOVE es el evento que Blockly dispara cuando un bloque cambia de padre.
//   Filtrando por newParentId === this.id sabemos con certeza que el bloque recién
//   conectado ES hijo de ESTE HAVING, sin necesidad de filtrar por blockId externo.
//   Se usa setTimeout para diferir el dispose del bloque original fuera del ciclo
//   de eventos actual y evitar problemas de reentrada.
export const HAVING_ONCHANGE = function (event) {
  if (!this.workspace || this.workspace.isFlyout) return;
  if (event.type !== Blockly.Events.BLOCK_MOVE) return;
  if (event.newParentId !== this.id) return;

  const exprInput = this.getInput('EXPRESSION');
  const connectedBlock = exprInput?.connection?.targetBlock();
  if (!connectedBlock || connectedBlock.type !== 'sql_expression') return;

  setTimeout(() => {
    if (this.disposed || !this.workspace) return;
    const input = this.getInput('EXPRESSION');
    const connBlock = input?.connection?.targetBlock();
    if (!connBlock || connBlock.type !== 'sql_expression') return;

    const column = connBlock.getFieldValue('COLUMN');
    const conn = input.connection;

    Blockly.Events.setGroup(true);
    try {
      conn.disconnect();
      const singleBlock = this.workspace.newBlock('sql_expression_single');
      singleBlock.setFieldValue(column, 'COLUMN');
      singleBlock.initSvg();
      singleBlock.render();
      conn.connect(singleBlock.outputConnection);
      connBlock.dispose();
    } catch (e) {
      console.error('Error al auto-transformar Expression → ExpressionSingle en HAVING:', e);
    } finally {
      Blockly.Events.setGroup(false);
    }
  }, 0);
};