// sqla-app/src/js/blocks/fromBlock.js
// SOLO EXPORTA: La forma (JSON) y el generador (función)

export const FROM_DEFINITION = {
    "type": "sql_from",
    "message0": "FROM %1",
    "args0": [
      {
        "type": "field_input",
        "name": "TABLE_NAME",
        "text": "mi_tabla"
      }
    ],
    "previousStatement": "SQL_STATEMENT",
    "nextStatement": "SQL_STATEMENT",
    "colour": 160,
    "tooltip": "Especifica la tabla de origen.",
    "helpUrl": ""
};

export const FROM_GENERATOR = function(block) {
    const tableName = block.getFieldValue('TABLE_NAME');
    const code = 'FROM ' + tableName + '\n';
    return code;
};