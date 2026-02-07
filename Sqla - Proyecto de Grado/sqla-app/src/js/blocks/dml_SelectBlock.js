// sqla-app/src/js/blocks/selectBlock.js
// SOLO EXPORTA: La forma (JSON) y el generador (función)

export const SELECT_DEFINITION = {
    "type": "sql_select",
    "message0": "SELECT %1",
    "args0": [
      {
        "type": "input_value",
        "name": "COLUMNS",
        "check": null
      }
    ],
    "previousStatement": "SQL_STATEMENT",
    "nextStatement": "SQL_STATEMENT",
    "colour": 160,
    "tooltip": "Selecciona columnas de una tabla.",
    "helpUrl": ""
};

export const SELECT_GENERATOR = function(block, generator) {
    // Nota: 'Blockly' está disponible globalmente gracias a las importaciones del controlador
    const columns = generator.valueToCode(block, 'COLUMNS', generator.ORDER_NONE) || '*'; 
    const code = `SELECT ${columns}\n`;
    return code;
};