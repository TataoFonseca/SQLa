// sqla-app/src/js/blocks/dml_DistinctBlock.js
// Bloque DISTINCT que envuelve expresiones
//Pierde la capacidad de tener un NEXT (recibir expresiones), por lo que se debe conectar directamente al bloque SELECT

export const DISTINCT_DEFINITION = {
  "type": "sql_distinct",
  "message0": "DISTINCT %1",
  "args0": [
    {
      "type": "input_value",
      // "name": "EXPRESSION",
      "name": "NEXT",
      // "check": ["Expression", "TopExpression", "Column"]
      "check": ["TopFlag", "Expression", "Column", "Aggregate"]
    }
  ],
  // "output": "DistinctExpression",
  "output": "DistinctFlag",
  "colour": 230,
  "tooltip": "Aplica DISTINCT a la consulta para eliminar duplicados",
  "helpUrl": ""
};

export const DISTINCT_GENERATOR = function (block, generator) {
  const next = generator.valueToCode(block, 'NEXT', generator.ORDER_ATOMIC);
  if (!next) return ['DISTINCT', generator.ORDER_ATOMIC];
  return [`DISTINCT ${next}`, generator.ORDER_ATOMIC];
};
