// sqla-app/src/js/blocks/dml_FromSimpleBlock.js
// FROM simple — sin soporte de JOINs, creado en base a la primera version de dml_FromBlock.js que fue modificado para dar soporte a clausulas/bloques JOIN.
// Click derecho → "Add JOIN clause" reemplaza este bloque por sql_from_joins.
//
// [Orden de cláusulas DML]
// previousStatement: "SQL_AFTER_SELECT" → FROM solo puede ir después de SELECT
// nextStatement:     "SQL_AFTER_FROM"   → después de FROM: WHERE, GROUP BY u ORDER BY
//
// [Auto-attach SELECT]
// FROM_ONCHANGE se reutiliza desde dml_FromBlock.js (mismo comportamiento).
// Se re-exporta aquí para que appController pueda importarlo desde este archivo si lo necesita.
export { FROM_ONCHANGE } from './dml_FromBlock.js';

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
    "previousStatement": "SQL_AFTER_SELECT",
    "nextStatement": "SQL_AFTER_FROM",
    "colour": 160,
    "tooltip": "Tabla de origen. Click derecho para añadir JOINs.",
    "helpUrl": "",
    "extensions": ["from_context_menu"]
};

export const FROM_SIMPLE_GENERATOR = function(block, generator) {
    const tableName = block.getFieldValue('TABLE_NAME');
    return 'FROM ' + tableName + '\n';
};
