// sqla-app/src/js/blocks/extensions/primaryKeyContextMenu.js
// Extensión para agregar PRIMARY KEY mediante menú contextual en columnas
// Solo permite UNA PRIMARY KEY en toda la tabla

import * as Blockly from 'blockly';
// Busca el CREATE TABLE padre subiendo por previousConnection
function findCreateTableParent(block) {
  let current = block;
  while (current) {
    const parent = current.getSurroundParent();
    if (!parent) return null;
    if (parent.type === 'sql_create_table') return parent;
    current = parent;
  }
  return null;
}

// Busca si ya existe un sql_column_primary_key en la tabla
// Retorna el nombre de la columna PK o null
function findExistingPK(createTableBlock) {
  if (!createTableBlock) return null;
  let current = createTableBlock.getInputTargetBlock('COLUMNS');
  while (current) {
    if (current.type === 'sql_column_primary_key') {
      return current.getFieldValue('COLUMN_NAME');
    }
    current = current.getNextBlock();
  }
  return null;
}

// Convierte sql_column_definition → sql_column_primary_key
function convertToPrimaryKey(block) {
  // const workspace  = block.workspace;
  // const columnName = block.getFieldValue('COLUMN_NAME');
  // const dataType   = block.getFieldValue('DATA_TYPE');

  // // Conexiones vecinas
  // const prevConn = block.previousConnection?.targetConnection ?? null;
  // const nextConn = block.nextConnection?.targetConnection ?? null;

  // Blockly.Events.setGroup(true);
  // try {
  //   // Desconectar el bloque actual (y sus constraints se descartan con él)
  //   if (prevConn) block.previousConnection.disconnect();
  //   if (nextConn) block.nextConnection.disconnect();
  //   block.dispose(false);

  //   // Crear el bloque PK
  //   const pkBlock = workspace.newBlock('sql_column_primary_key');
  //   pkBlock.setFieldValue(columnName, 'COLUMN_NAME');
  //   pkBlock.setFieldValue(dataType,   'DATA_TYPE');
  //   pkBlock.initSvg();
  //   pkBlock.render();

  //   // Reconectar en el mismo lugar
  //   if (prevConn) prevConn.connect(pkBlock.previousConnection);
  //   if (nextConn) nextConn.connect(pkBlock.nextConnection);

  // } catch(e) {
  //   console.error('Error al convertir a Primary Key:', e);
  // } finally {
  //   Blockly.Events.setGroup(false);
  // }

  const workspace = block.workspace;
  const columnName = block.getFieldValue('COLUMN_NAME');
  const dataType = block.getFieldValue('DATA_TYPE');

  const prevConn = block.previousConnection?.targetConnection ?? null;
  const nextConn = block.nextConnection?.targetConnection ?? null;
  const position = block.getRelativeToSurfaceXY();

  Blockly.Events.setGroup(true);
  Blockly.Events.disable();
  try {
    if (prevConn) block.previousConnection.disconnect();
    if (nextConn) block.nextConnection.disconnect();
    block.dispose(false);

    const pkBlock = workspace.newBlock('sql_column_primary_key');
    pkBlock.setFieldValue(columnName, 'COLUMN_NAME');
    pkBlock.setFieldValue(dataType, 'DATA_TYPE');
    pkBlock.initSvg();

    if (prevConn) prevConn.connect(pkBlock.previousConnection);
    else pkBlock.moveTo(position);

    if (nextConn) nextConn.connect(pkBlock.nextConnection);

    pkBlock.render();

  } catch (e) {
    console.error('Error al convertir a Primary Key:', e);
  } finally {
    Blockly.Events.enable();
    Blockly.Events.setGroup(false);
  }
}

// Convierte sql_column_primary_key → sql_column_definition
function convertToNormalColumn(block) {
  // const workspace  = block.workspace;
  // const columnName = block.getFieldValue('COLUMN_NAME');
  // const dataType   = block.getFieldValue('DATA_TYPE');

  // const prevConn = block.previousConnection?.targetConnection ?? null;
  // const nextConn = block.nextConnection?.targetConnection ?? null;

  // Blockly.Events.setGroup(true);
  // try {
  //   if (prevConn) block.previousConnection.disconnect();
  //   if (nextConn) block.nextConnection.disconnect();
  //   block.dispose(false);

  //   const colBlock = workspace.newBlock('sql_column_definition');
  //   colBlock.setFieldValue(columnName, 'COLUMN_NAME');
  //   colBlock.setFieldValue(dataType,   'DATA_TYPE');
  //   colBlock.initSvg();
  //   colBlock.render();

  //   if (prevConn) prevConn.connect(colBlock.previousConnection);
  //   if (nextConn) nextConn.connect(colBlock.nextConnection);

  // } catch(e) {
  //   console.error('Error al convertir a columna normal:', e);
  // } finally {
  //   Blockly.Events.setGroup(false);
  // }

  const workspace = block.workspace;
  const columnName = block.getFieldValue('COLUMN_NAME');
  const dataType = block.getFieldValue('DATA_TYPE');

  const prevConn = block.previousConnection?.targetConnection ?? null;
  const nextConn = block.nextConnection?.targetConnection ?? null;

  // Capturar posición antes de disponer
  const position = block.getRelativeToSurfaceXY();

  Blockly.Events.setGroup(true);
  Blockly.Events.disable();
  try {
    if (prevConn) block.previousConnection.disconnect();
    if (nextConn) block.nextConnection.disconnect();
    block.dispose(false);

    const colBlock = workspace.newBlock('sql_column_definition');
    colBlock.setFieldValue(columnName, 'COLUMN_NAME');
    colBlock.setFieldValue(dataType, 'DATA_TYPE');
    colBlock.initSvg();

    if (prevConn) prevConn.connect(colBlock.previousConnection);
    else colBlock.moveTo(position);

    if (nextConn) nextConn.connect(colBlock.nextConnection);

    colBlock.render();

  } catch (e) {
    console.error('Error al convertir a columna normal:', e);
  } finally {
    Blockly.Events.enable();
    Blockly.Events.setGroup(false);
  }
}

// ── Registro ───────────────────────────────────────────────────────────────

export function registerPrimaryKeyContextMenu() {

  // Extensión para sql_column_definition → opción "Convertir a Primary Key"
  Blockly.Extensions.register('column_to_pk_context_menu', function () {
    this.customContextMenu = function (options) {
      const block = this;
      if (!block.workspace || block.workspace.isFlyout) return;

      const createTable = findCreateTableParent(block);
      const existingPK = findExistingPK(createTable);
      const canConvert = existingPK === null;

      options.push({ text: '─────────────', enabled: false, callback: () => { } });

      options.push({
        text: '🥇 Convertir a Primary Key',
        enabled: canConvert,
        callback: () => convertToPrimaryKey(block)
      });

      if (!canConvert) {
        options.push({
          text: `   └─ PK ya existe en: "${existingPK}"`,
          enabled: false,
          callback: () => { }
        });
      }
    };
  });

  // Extensión para sql_column_primary_key → opción "Convertir a columna normal"
  Blockly.Extensions.register('pk_to_column_context_menu', function () {
    this.customContextMenu = function (options) {
      const block = this;
      if (!block.workspace || block.workspace.isFlyout) return;

      options.push({ text: '─────────────', enabled: false, callback: () => { } });

      options.push({
        text: '⬜ Convertir a columna normal',
        enabled: true,
        callback: () => convertToNormalColumn(block)
      });
    };
  });
}