// sqla-app/src/js/blocks/dml_FromSimpleBlock.js
// FROM simple — sin soporte de JOINs, creado en base a la primera version de dml_FromBlock.js que fue modificado para dar soporte a clausulas/bloques JOIN.
// Click derecho → "Add JOIN clause" reemplaza este bloque por sql_from_joins.

export const FROM_SIMPLE_DEFINITION = {
    "type": "sql_from_simple",
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
    "tooltip": "Tabla de origen. Click derecho para añadir JOINs.",
    "helpUrl": "",
    "extensions": ["from_context_menu"]
};

export const FROM_SIMPLE_GENERATOR = function(block, generator) {
    const tableName = block.getFieldValue('TABLE_NAME');
    return 'FROM ' + tableName + '\n';
};
