// // sqla-app/src/js/blocks/dml_selectBlock.js
// // SOLO EXPORTA: La forma (JSON) y el generador (función)

// export const SELECT_DEFINITION = {
//     "type": "sql_select",
//     "message0": "SELECT %1",
//     "args0": [
//       {
//         "type": "input_value",
//         "name": "COLUMNS",
//         "check": null
//       }
//     ],
//     "previousStatement": "SQL_STATEMENT",
//     "nextStatement": "SQL_STATEMENT",
//     "colour": 160,
//     "tooltip": "Selecciona columnas de una tabla.",
//     "helpUrl": ""
// };

// export const SELECT_GENERATOR = function(block, generator) {
//     // Nota: 'Blockly' está disponible globalmente gracias a las importaciones del controlador
//     const columns = generator.valueToCode(block, 'COLUMNS', generator.ORDER_NONE) || '*'; 
//     const code = `SELECT ${columns}\n`;
//     return code;
// };


//////
// sqla-app/src/js/blocks/dml_SelectBlock.js
// MEJORADO: SELECT con flags globales DISTINCT y TOP + mutator para múltiples expresiones

// export const SELECT_DEFINITION = {
//   "type": "sql_select",
//   "message0": "SELECT",
//   "message1": "%1 DISTINCT   %2 TOP ( %3 )",
//   "args1": [
//     {
//       "type": "field_checkbox",
//       "name": "GLOBAL_DISTINCT",
//       "checked": false
//     },
//     {
//       "type": "field_checkbox",
//       "name": "GLOBAL_TOP",
//       "checked": false
//     },
//     {
//       "type": "field_number",
//       "name": "GLOBAL_TOP_NUMBER",
//       "value": 10,
//       "min": 1
//     }
//   ],
//   "message2": "%1",
//   "args2": [
//     {
//       "type": "input_value",
//       "name": "EXPR0",
//       "check": ["Expression", "Column", "DistinctExpression", "TopExpression"],
//       "align": "RIGHT"
//     }
//   ],
//   "previousStatement": "SQL_STATEMENT",
//   "nextStatement": "SQL_STATEMENT",
//   "colour": 160,
//   "tooltip": "Instrucción SELECT con soporte para DISTINCT y TOP globales",
//   "helpUrl": "",
//   "mutator": "select_mutator"
// };

// export const SELECT_GENERATOR = function(block, generator) {
//   const globalDistinct = block.getFieldValue('GLOBAL_DISTINCT') === 'TRUE';
//   const globalTop = block.getFieldValue('GLOBAL_TOP') === 'TRUE';
//   const globalTopNumber = block.getFieldValue('GLOBAL_TOP_NUMBER');
  
//   // Construir flags globales
//   let flags = '';
//   if (globalDistinct) {
//     flags += ' DISTINCT';
//   }
//   if (globalTop) {
//     flags += ' TOP (' + globalTopNumber + ')';
//   }
  
//   // Obtener número de expresiones del mutator
//   const exprCount = block.exprCount_ || 1;
  
//   // Construir lista de expresiones
//   const expressions = [];
//   for (let i = 0; i < exprCount; i++) {
//     const expr = generator.valueToCode(block, 'EXPR' + i, generator.ORDER_NONE);
//     if (expr) {
//       expressions.push(expr);
//     }
//   }
  
//   if (expressions.length === 0) {
//     return 'SELECT *\n';
//   }
  
//   const code = 'SELECT' + flags + '\n  ' + expressions.join(',\n  ') + '\n';
//   return code;
// };

// // ==========================================
// // MUTATOR PARA AGREGAR/QUITAR EXPRESIONES
// // ==========================================

// export const SELECT_MUTATOR_MIXIN = {
//   exprCount_: 1,
  
//   /**
//    * Crear el XML del mutator
//    */
//   mutationToDom: function() {
//     const container = document.createElement('mutation');
//     container.setAttribute('expressions', this.exprCount_);
//     return container;
//   },
  
//   /**
//    * Parsear el XML del mutator
//    */
//   domToMutation: function(xmlElement) {
//     const expressions = parseInt(xmlElement.getAttribute('expressions'), 10) || 1;
//     this.updateShape_(expressions);
//   },
  
//   /**
//    * Crear el editor del mutator
//    */
//   decompose: function(workspace) {
//     const containerBlock = workspace.newBlock('select_expression_container');
//     containerBlock.initSvg();
    
//     let connection = containerBlock.getInput('STACK').connection;
//     for (let i = 0; i < this.exprCount_; i++) {
//       const itemBlock = workspace.newBlock('select_expression_item');
//       itemBlock.initSvg();
//       connection.connect(itemBlock.previousConnection);
//       connection = itemBlock.nextConnection;
//     }
    
//     return containerBlock;
//   },
  
//   /**
//    * Reconstruir desde el editor del mutator
//    */
//   compose: function(containerBlock) {
//     let itemBlock = containerBlock.getInput('STACK').connection.targetBlock();
    
//     // Contar expresiones
//     const connections = [];
//     while (itemBlock) {
//       connections.push(itemBlock.valueConnection_);
//       itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
//     }
    
//     // Actualizar forma
//     this.updateShape_(connections.length);
    
//     // Reconectar expresiones
//     for (let i = 0; i < connections.length; i++) {
//       if (connections[i]) {
//         const input = this.getInput('EXPR' + i);
//         if (input && connections[i].targetBlock()) {
//           input.connection.connect(connections[i]);
//         }
//       }
//     }
//   },
  
//   /**
//    * Guardar conexiones antes de actualizar
//    */
//   saveConnections: function(containerBlock) {
//     let itemBlock = containerBlock.getInput('STACK').connection.targetBlock();
//     let i = 0;
    
//     while (itemBlock) {
//       const input = this.getInput('EXPR' + i);
//       itemBlock.valueConnection_ = input && input.connection.targetConnection;
//       i++;
//       itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
//     }
//   },
  
//   /**
//    * Actualizar la forma del bloque según el número de expresiones
//    */
//   updateShape_: function(expressionCount) {
//     // Asegurar al menos 1 expresión
//     expressionCount = Math.max(1, expressionCount);
    
//     // Remover inputs extras
//     while (this.exprCount_ > expressionCount) {
//       this.removeInput('EXPR' + (this.exprCount_ - 1));
//       this.exprCount_--;
//     }
    
//     // Agregar inputs nuevos
//     while (this.exprCount_ < expressionCount) {
//       const input = this.appendValueInput('EXPR' + this.exprCount_)
//           .setCheck(["Expression", "Column", "DistinctExpression", "TopExpression"])
//           .setAlign(Blockly.ALIGN_RIGHT);
      
//       if (this.exprCount_ > 0) {
//         input.appendField(',');
//       }
      
//       this.exprCount_++;
//     }
//   }
// };

// // ==========================================
// // Bloques auxiliares del Mutator
// // ==========================================

// export const SELECT_EXPRESSION_CONTAINER = {
//   "type": "select_expression_container",
//   "message0": "Expresiones SELECT %1",
//   "args0": [
//     {
//       "type": "input_statement",
//       "name": "STACK"
//     }
//   ],
//   "colour": 160,
//   "tooltip": "Agregar o quitar expresiones del SELECT",
//   "helpUrl": ""
// };

// export const SELECT_EXPRESSION_ITEM = {
//   "type": "select_expression_item",
//   "message0": "expresión",
//   "previousStatement": null,
//   "nextStatement": null,
//   "colour": 160,
//   "tooltip": "Una expresión en el SELECT",
//   "helpUrl": ""
// };


//SELECT sin las variables globales de DISTINCT y TOP, para simplificar el bloque principal. Las opciones globales (DISTINCT y TOP) se pueden manejar desde el bloque ExpressionBlock.js.
// sqla-app/src/js/blocks/dml_SelectBlock.js
// MEJORADO: SELECT con mutator para múltiples expresiones (SIN flags globales)

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
  // "mutator": "select_mutator"
};

export const SELECT_GENERATOR = function(block, generator) {
    // Obtener el valor de la expresión
  const expr = generator.valueToCode(block, 'EXPR0', generator.ORDER_NONE);
  
  if (!expr) {
    return 'SELECT *\n';
  }
  
  const code = 'SELECT\n  ' + expr + '\n';
  return code;

  // // Obtener número de expresiones del mutator - En caso de querer usar mutadores, descomentar esta línea y el bloque mutator
  // const exprCount = block.exprCount_ || 1;
  
  // // Construir lista de expresiones
  // const expressions = [];
  // for (let i = 0; i < exprCount; i++) {
  //   const expr = generator.valueToCode(block, 'EXPR' + i, generator.ORDER_NONE);
  //   if (expr) {
  //     expressions.push(expr);
  //   }
  // }
  
  // if (expressions.length === 0) {
  //   return 'SELECT *\n';
  // }
  
  // const code = 'SELECT\n  ' + expressions.join(',\n  ') + '\n';
  // return code;

};

// // ==========================================
// // MUTATOR PARA AGREGAR/QUITAR EXPRESIONES
// // ==========================================

// export const SELECT_MUTATOR_MIXIN = {
//   exprCount_: 1,
  
//   /**
//    * Crear el XML del mutator
//    */
//   mutationToDom: function() {
//     const container = document.createElement('mutation');
//     container.setAttribute('expressions', this.exprCount_);
//     return container;
//   },
  
//   /**
//    * Parsear el XML del mutator
//    */
//   domToMutation: function(xmlElement) {
//     const expressions = parseInt(xmlElement.getAttribute('expressions'), 10) || 1;
//     this.updateShape_(expressions);
//   },
  
//   /**
//    * Crear el editor del mutator
//    */
//   decompose: function(workspace) {
//     const containerBlock = workspace.newBlock('select_expression_container');
//     containerBlock.initSvg();
    
//     let connection = containerBlock.getInput('STACK').connection;
//     for (let i = 0; i < this.exprCount_; i++) {
//       const itemBlock = workspace.newBlock('select_expression_item');
//       itemBlock.initSvg();
//       connection.connect(itemBlock.previousConnection);
//       connection = itemBlock.nextConnection;
//     }
    
//     return containerBlock;
//   },
  
//   /**
//    * Reconstruir desde el editor del mutator
//    */
//   compose: function(containerBlock) {
//     let itemBlock = containerBlock.getInput('STACK').connection.targetBlock();
    
//     // Contar expresiones
//     const connections = [];
//     while (itemBlock) {
//       connections.push(itemBlock.valueConnection_);
//       itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
//     }
    
//     // Actualizar forma
//     this.updateShape_(connections.length);
    
//     // Reconectar expresiones
//     for (let i = 0; i < connections.length; i++) {
//       if (connections[i]) {
//         const input = this.getInput('EXPR' + i);
//         if (input && connections[i].targetBlock()) {
//           input.connection.connect(connections[i]);
//         }
//       }
//     }
//   },
  
//   /**
//    * Guardar conexiones antes de actualizar
//    */
//   saveConnections: function(containerBlock) {
//     let itemBlock = containerBlock.getInput('STACK').connection.targetBlock();
//     let i = 0;
    
//     while (itemBlock) {
//       const input = this.getInput('EXPR' + i);
//       itemBlock.valueConnection_ = input && input.connection.targetConnection;
//       i++;
//       itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
//     }
//   },
  
//   /**
//    * Actualizar la forma del bloque según el número de expresiones
//    */
//   updateShape_: function(expressionCount) {
//     // Asegurar al menos 1 expresión
//     expressionCount = Math.max(1, expressionCount);
    
//     // Remover inputs extras
//     while (this.exprCount_ > expressionCount) {
//       this.removeInput('EXPR' + (this.exprCount_ - 1));
//       this.exprCount_--;
//     }
    
//     // Agregar inputs nuevos
//     while (this.exprCount_ < expressionCount) {
//       const input = this.appendValueInput('EXPR' + this.exprCount_)
//           .setCheck(["Expression", "Column", "DistinctExpression", "TopExpression"])
//           .setAlign(Blockly.ALIGN_RIGHT);
      
//       if (this.exprCount_ > 0) {
//         input.appendField(',');
//       }
      
//       this.exprCount_++;
//     }
//   }
// };

// // ==========================================
// // Bloques auxiliares del Mutator
// // ==========================================

// export const SELECT_EXPRESSION_CONTAINER = {
//   "type": "select_expression_container",
//   "message0": "Expresiones SELECT %1",
//   "args0": [
//     {
//       "type": "input_statement",
//       "name": "STACK"
//     }
//   ],
//   "colour": 160,
//   "tooltip": "Agregar o quitar expresiones del SELECT",
//   "helpUrl": ""
// };

// export const SELECT_EXPRESSION_ITEM = {
//   "type": "select_expression_item",
//   "message0": "expresión",
//   "previousStatement": null,
//   "nextStatement": null,
//   "colour": 160,
//   "tooltip": "Una expresión en el SELECT",
//   "helpUrl": ""
// };