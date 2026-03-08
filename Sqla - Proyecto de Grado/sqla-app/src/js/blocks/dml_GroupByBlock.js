// sqla-app/src/js/blocks/dml_GroupByBlock.js
// Bloque GROUP BY — Statement (puzzle), acepta GroupByColumn en su input COLUMNS
// Al crearse, auto-inserta un bloque sql_groupby_column como starter

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
  "previousStatement": "SQL_STATEMENT",
  "nextStatement": "SQL_STATEMENT",
  "colour": 200,
  "tooltip": "Agrupa los resultados por una o más columnas.",
  "helpUrl": ""
};

export const GROUPBY_GENERATOR = function(block, generator) {
  const columns = generator.valueToCode(block, 'COLUMNS', generator.ORDER_ATOMIC);
  if (!columns) return '';
  return 'GROUP BY ' + columns + '\n';
};

// onchange: al crearse el bloque en el workspace (no en el flyout),
// auto-inserta un sql_groupby_column en el input COLUMNS
export const GROUPBY_ONCHANGE = function(event) {
  // Solo reaccionar al evento de creación del bloque
  if (event.type !== 'create' || event.blockId !== this.id) return;
  // No actuar en el flyout/toolbox
  if (this.workspace.isFlyout) return;
  // Si ya tiene algo conectado, no hacer nada
  const columnsInput = this.getInput('COLUMNS');
  if (!columnsInput || columnsInput.connection.isConnected()) return;

  // Crear y conectar el bloque starter
  const starterBlock = this.workspace.newBlock('sql_groupby_column');
  starterBlock.initSvg();
  starterBlock.render();

  columnsInput.connection.connect(starterBlock.outputConnection);
};
