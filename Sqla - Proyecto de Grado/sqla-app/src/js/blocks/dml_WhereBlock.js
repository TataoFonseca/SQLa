// sqla-app/src/js/blocks/dml_WhereBlock.js

export const WHERE_DEFINITION = {
  "type": "sql_where",
  "message0": "WHERE %1",
  "args0": [
    {
      "type": "input_value",
      "name": "CONDITION",
      "check": ["Condition"]
    }
  ],
  "inputsInline": true,
  "previousStatement": "SQL_STATEMENT",
  "nextStatement": "SQL_STATEMENT",
  "colour": 30,
  "tooltip": "Filtra filas. Click derecho para agregar una condición.",
  "helpUrl": "",
  "extensions": ["where_context_menu"]
};

export const WHERE_GENERATOR = function (block, generator) {
  const condition = generator.valueToCode(block, 'CONDITION', generator.ORDER_ATOMIC);
  if (!condition) return '';
  return 'WHERE ' + condition + '\n';
};