// // sqla-app/src/js/blocks/dml_selectBlock.js
// // SOLO EXPORTA: La forma (JSON) y el generador (función)

//SELECT sin las variables globales de DISTINCT y TOP, para simplificar el bloque principal. Las opciones globales (DISTINCT y TOP) se pueden manejar desde el bloque ExpressionBlock.js.
// sqla-app/src/js/blocks/dml_SelectBlock.js

export const SELECT_DEFINITION = {
  "type": "sql_select",
  "message0": "SELECT %1",
  "args0": [
    {
      "type": "input_value",
      "name": "EXPR0",
      "check": ["Expression", "Column", "DistinctExpression", "TopExpression"],
      "align": "RIGHT"
    }
  ],
  "previousStatement": "SQL_STATEMENT",
  "nextStatement": "SQL_STATEMENT",
  "colour": 160,
  "tooltip": "Instrucción SELECT. Click derecho en expresiones para agregar DISTINCT o TOP",
  "helpUrl": "",
};

export const SELECT_GENERATOR = function(block, generator) {
    // Obtener el valor de la expresión
  const expr = generator.valueToCode(block, 'EXPR0', generator.ORDER_NONE);
  
  if (!expr) {
    return 'SELECT *\n';
  }
  
  const code = 'SELECT\n  ' + expr + '\n';
  return code;

};