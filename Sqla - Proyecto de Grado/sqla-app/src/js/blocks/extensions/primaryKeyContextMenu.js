// sqla-app/src/js/blocks/extensions/primaryKeyContextMenu.js
// Extensión para agregar PRIMARY KEY mediante menú contextual en columnas
// Solo permite UNA PRIMARY KEY en toda la tabla

import * as Blockly from 'blockly';

/**
 * Extensión del menú contextual para columnas.
 * Permite agregar/quitar PRIMARY KEY con validación global.
 */
export function registerPrimaryKeyContextMenu() {
  
  Blockly.Extensions.register('column_primary_key_context_menu', function() {
    
    this.customContextMenu = function(options) {
      const block = this;
      const workspace = block.workspace;
      
      if (!workspace || workspace.isFlyout) {
        return; // No mostrar en el flyout/toolbox
      }
      
      // Verificar si esta columna ya tiene PRIMARY KEY
      const hasPrimaryKey = hasColumnPrimaryKey(block);
      
      // Buscar si existe PRIMARY KEY en la tabla
      const createTableBlock = findCreateTableParent(block);
      const pkLocation = findPrimaryKeyInTable(createTableBlock);
      
      // Separador visual
      options.push({
        text: '─'.repeat(25),
        enabled: false,
        callback: function() {}
      });
      
      // ==========================================
      // OPCIÓN: Add PRIMARY KEY
      // ==========================================
      if (!hasPrimaryKey) {
        const canAddPK = pkLocation === null;
        
        options.push({
          text: canAddPK ? '➕ Add PRIMARY KEY' : '⚠️ PRIMARY KEY ya existe',
          enabled: canAddPK,
          callback: function() {
            addPrimaryKeyToColumn(block, workspace);
          }
        });
        
        // Si ya existe PK en otra ubicación, mostrar dónde está
        if (!canAddPK && pkLocation) {
          options.push({
            text: `   └─ En columna: "${pkLocation}"`,
            enabled: false,
            callback: function() {}
          });
        }
      }
      
      // ==========================================
      // OPCIÓN: Remove PRIMARY KEY
      // ==========================================
      if (hasPrimaryKey) {
        options.push({
          text: '✓ Esta columna es PRIMARY KEY',
          enabled: false,
          callback: function() {}
        });
        
        options.push({
          text: '❌ Remove PRIMARY KEY',
          enabled: true,
          callback: function() {
            removePrimaryKeyFromColumn(block);
          }
        });
      }
      
      // ==========================================
      // INFO: Recordatorio sobre NOT NULL
      // ==========================================
      if (hasPrimaryKey) {
        options.push({
          text: '─'.repeat(25),
          enabled: false,
          callback: function() {}
        });
        
        options.push({
          text: 'ℹ️ PRIMARY KEY implica NOT NULL',
          enabled: false,
          callback: function() {}
        });
      }
    };
  });
}

/**
 * Busca el bloque CREATE TABLE padre de esta columna
 */
function findCreateTableParent(columnBlock) {
  let current = columnBlock;
  
  while (current) {
    const parent = current.getSurroundParent();
    if (parent && parent.type === 'sql_create_table') {
      return parent;
    }
    current = parent;
  }
  
  return null;
}

/**
 * Verifica si esta columna tiene PRIMARY KEY conectado
 */
function hasColumnPrimaryKey(columnBlock) {
  const constraintsInput = columnBlock.getInput('CONSTRAINTS');
  if (!constraintsInput) return false;
  
  let currentConstraint = constraintsInput.connection.targetBlock();
  
  while (currentConstraint) {
    if (currentConstraint.type === 'sql_column_primary_key') {
      return true;
    }
    currentConstraint = currentConstraint.getNextBlock();
  }
  
  return false;
}

/**
 * Busca si existe PRIMARY KEY en alguna columna de la tabla
 * Retorna el nombre de la columna con PK, o null si no existe
 */
function findPrimaryKeyInTable(createTableBlock) {
  if (!createTableBlock) return null;
  
  const columnsInput = createTableBlock.getInput('COLUMNS');
  if (!columnsInput) return null;
  
  let currentColumn = columnsInput.connection.targetBlock();
  
  while (currentColumn) {
    if (currentColumn.type === 'sql_column_definition') {
      if (hasColumnPrimaryKey(currentColumn)) {
        const columnName = currentColumn.getFieldValue('COLUMN_NAME');
        return columnName;
      }
    }
    currentColumn = currentColumn.getNextBlock();
  }
  
  return null;
}

/**
 * Agrega el bloque PRIMARY KEY a la columna
 */
function addPrimaryKeyToColumn(columnBlock, workspace) {
  Blockly.Events.setGroup(true);
  
  try {
    // Crear el bloque PRIMARY KEY
    const pkBlock = workspace.newBlock('sql_column_primary_key');
    pkBlock.initSvg();
    pkBlock.render();
    
    // Obtener la conexión de CONSTRAINTS
    const constraintsInput = columnBlock.getInput('CONSTRAINTS');
    if (!constraintsInput) {
      console.error('No se encontró el input CONSTRAINTS');
      pkBlock.dispose();
      return;
    }
    
    const constraintsConnection = constraintsInput.connection;
    
    // Buscar el último constraint conectado
    let lastConstraint = constraintsConnection.targetBlock();
    
    if (lastConstraint) {
      // Ya hay constraints, buscar el último
      while (lastConstraint.nextConnection && lastConstraint.nextConnection.targetBlock()) {
        lastConstraint = lastConstraint.nextConnection.targetBlock();
      }
      
      // Conectar al final de la cadena
      if (lastConstraint.nextConnection) {
        lastConstraint.nextConnection.connect(pkBlock.previousConnection);
      }
    } else {
      // No hay constraints, conectar directamente
      constraintsConnection.connect(pkBlock.previousConnection);
    }
    
    // Posicionar cerca de la columna
    const columnXY = columnBlock.getRelativeToSurfaceXY();
    pkBlock.moveBy(columnXY.x + 20, columnXY.y + 60);
    
    // Cambiar color de la columna para indicar que es PK
    columnBlock.setColour(290); // Color especial para PK
    
    // Seleccionar el nuevo bloque
    pkBlock.select();
    
  } catch (error) {
    console.error('Error al agregar PRIMARY KEY:', error);
  } finally {
    Blockly.Events.setGroup(false);
  }
}

/**
 * Remueve el bloque PRIMARY KEY de la columna
 */
function removePrimaryKeyFromColumn(columnBlock) {
  Blockly.Events.setGroup(true);
  
  try {
    const constraintsInput = columnBlock.getInput('CONSTRAINTS');
    if (!constraintsInput) return;
    
    let currentConstraint = constraintsInput.connection.targetBlock();
    let previousConstraint = null;
    
    // Buscar el bloque PRIMARY KEY
    while (currentConstraint) {
      if (currentConstraint.type === 'sql_column_primary_key') {
        const nextConstraint = currentConstraint.getNextBlock();
        
        // Desconectar
        if (previousConstraint) {
          // No es el primero, reconectar cadena
          currentConstraint.previousConnection.disconnect();
          currentConstraint.nextConnection?.disconnect();
          
          if (nextConstraint) {
            previousConstraint.nextConnection.connect(nextConstraint.previousConnection);
          }
        } else {
          // Es el primero
          currentConstraint.previousConnection.disconnect();
          
          if (nextConstraint) {
            constraintsInput.connection.connect(nextConstraint.previousConnection);
          }
        }
        
        // Eliminar el bloque
        currentConstraint.dispose();
        
        // Restaurar color original de la columna
        columnBlock.setColour(210);
        
        break;
      }
      
      previousConstraint = currentConstraint;
      currentConstraint = currentConstraint.getNextBlock();
    }
    
  } catch (error) {
    console.error('Error al remover PRIMARY KEY:', error);
  } finally {
    Blockly.Events.setGroup(false);
  }
}
