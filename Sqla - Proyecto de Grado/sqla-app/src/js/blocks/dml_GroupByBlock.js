// sqla-app/src/js/blocks/dml_GroupByBlock.js
// Bloque GROUP BY — Statement (puzzle), acepta GroupByColumn en su input COLUMNS
// Al crearse, auto-inserta un bloque sql_groupby_column como starter
//
// [Orden de cláusulas DML]
// previousStatement: ["SQL_AFTER_FROM", "SQL_AFTER_WHERE"] → GROUP BY puede ir después de FROM o WHERE
// nextStatement:     "SQL_AFTER_GROUPBY"                   → después de GROUP BY: HAVING u ORDER BY

export const GROUPBY_DEFINITION = {
  "type": "sql_group_by",
  "message0": "GROUP BY %1",
  "args0": [
    {
      "type": "input_value",
      "name": "COLUMNS",
      "check": ["GroupByColumn"]
    }
  ],
  "inputsInline": true,
  "previousStatement": ["SQL_AFTER_FROM", "SQL_AFTER_WHERE"],
  "nextStatement": "SQL_AFTER_GROUPBY",
  "colour": 200,
  "tooltip": "Agrupa los resultados por una o más columnas.",
  "helpUrl": ""
};

export const GROUPBY_GENERATOR = function (block, generator) {
  const columns = generator.valueToCode(block, 'COLUMNS', generator.ORDER_ATOMIC);
  if (!columns) return '';
  return 'GROUP BY ' + columns + '\n';
};

// onchange: al crearse el bloque en el workspace (no en el flyout),
// auto-inserta un sql_groupby_column en el input COLUMNS
export const GROUPBY_ONCHANGE = function (event) {
  if (event.type !== 'create' || event.blockId !== this.id) return;
  if (this.workspace.isFlyout) return;

  const columnsInput = this.getInput('COLUMNS');
  if (!columnsInput || columnsInput.connection.isConnected()) return;

  const starterBlock = this.workspace.newBlock('sql_groupby_column');
  starterBlock.initSvg();
  starterBlock.render();
  columnsInput.connection.connect(starterBlock.outputConnection);
};
