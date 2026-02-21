// // sqla-app/src/js/blocks/expressionBlock.js
// // SOLO EXPORTA: La forma (JSON) y el generador (función)

// export const EXPRESSION_DEFINITION = {
//   "type": "sql_expression",
//   "message0": "'' %1 ''",
//   "args0": [
//     {
//       "type": "field_input",
//       "name": "EXPRESSION",
//       "text": ""
//     }
//   ],
//   "output": null,
//   "colour": 230,
//   "tooltip": "Expresión SQL libre (columnas, funciones, operaciones, alias, etc.)",
//   "helpUrl": ""
// };

// export const EXPRESSION_GENERATOR = function(block, generator) {
//   const expression = block.getFieldValue('EXPRESSION');
//   return [expression, generator.ORDER_NONE];
// };

///////

// sqla-app/src/js/blocks/dml_ExpressionBlock.js
// MEJORADO: Con soporte para menú contextual de DISTINCT/TOP

export const EXPRESSION_DEFINITION = {
  "type": "sql_expression",
  "message0": "%1",
  "args0": [
    {
      "type": "field_input",
      "name": "COLUMN",
      "text": "column_name"
    }
  ],
  "output": ["Expression", "Column"],
  "colour": 160,
  "tooltip": "Nombre de columna. Click derecho para agregar DISTINCT o TOP",
  "helpUrl": "",
  "extensions": ["expression_context_menu"]  // ⭐ APLICAR LA EXTENSIÓN
};

export const EXPRESSION_GENERATOR = function(block, generator) {
  const column = block.getFieldValue('COLUMN');
  return [column, generator.ORDER_ATOMIC];
};
