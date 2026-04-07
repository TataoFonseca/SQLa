// sqla-app/src/js/blocks/fromBlock.js
// SOLO EXPORTA: La forma (JSON), el generador y el onchange (función)
//
// [Orden de cláusulas DML]
// previousStatement: "SQL_AFTER_SELECT" → FROM solo puede ir después de SELECT
// nextStatement:     "SQL_AFTER_FROM"   → después de FROM: WHERE, GROUP BY u ORDER BY
//
// [Auto-attach SELECT]
// FROM_ONCHANGE: inserta SELECT arriba de FROM, SOLO cuando FROM viene del toolbox.
// Si FROM ya existía en el workspace (conectado o suelto) y el usuario lo mueve,
// no se crea un SELECT nuevo — el que ya existía sigue siendo responsabilidad del usuario.
//
// Por qué BLOCK_DRAG end y no BLOCK_CREATE:
//   JOIN usa BLOCK_CREATE porque conecta hijos a sus propios value inputs, que son
//   parte geométrica del bloque y se mueven con él durante el drag.
//   SELECT se conecta ENCIMA de FROM (previousConnection), no es hijo de FROM,
//   no se mueve con él → con BLOCK_CREATE aparecía en (0,0) mientras FROM era arrastrado.
//   Con BLOCK_DRAG end, FROM ya está en su posición final cuando SELECT se crea.
//
// Requiere Blockly para los eventos; se registra en appController junto con el init.
import * as Blockly from 'blockly';

export const FROM_DEFINITION = {
  "type": "sql_from",
  "message0": "FROM %1 %2",
  "args0": [
    {
      "type": "field_input",
      "name": "TABLE_NAME",
      "text": "mi_tabla"
    },
    {
      // Input tipo STATEMENT: la "boquilla" abierta donde entran los JOIN blocks
      "type": "input_statement",
      "name": "JOINS",
      "check": "SQL_JOIN"   // Solo acepta bloques cuyo previousStatement sea "SQL_JOIN"
    }
  ],
  "previousStatement": "SQL_AFTER_SELECT",
  "nextStatement": "SQL_AFTER_FROM",
  "colour": 160,
  "tooltip": "Especifica la tabla de origen.",
  "helpUrl": "",
  "extensions": ["from_joins_context_menu"]
};

export const FROM_GENERATOR = function (block, generator) {
  const tableName = block.getFieldValue('TABLE_NAME');
  // Genera el código de todos los JOINs encadenados dentro de la boquilla
  const joinsCode = generator.statementToCode(block, 'JOINS');

  // joinsCode ya viene con indentación por defecto de Blockly; la limpiamos
  const joinsTrimmed = joinsCode
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

  let code = 'FROM ' + tableName;
  if (joinsTrimmed) {
    code += '\n' + joinsTrimmed;
  }

  // const code = 'FROM ' + tableName + '\n';
  code += '\n';

  return code;
};

// onchange: al SOLTAR el bloque FROM en el workspace, auto-inserta SELECT arriba si no tiene predecesor.
//
// Por qué BLOCK_DRAG (fin) y no BLOCK_CREATE:
// JOIN puede usar BLOCK_CREATE porque conecta bloques como hijos de sus propios inputs (value inputs),
// por lo que esos hijos son parte geométrica de JOIN y se mueven con él durante el drag.
// SELECT se conecta ENCIMA de FROM vía previousConnection — no es hijo de FROM, no se mueve con él.
// Con BLOCK_CREATE, SELECT aparecía en (0,0) mientras FROM estaba siendo arrastrado.
// Con BLOCK_DRAG end, FROM ya está en su posición final cuando SELECT se crea → sin flash ni salto.
export const FROM_ONCHANGE = function (event) {
  if (event.blockId !== this.id) return;

  const workspace = this.workspace;
  if (!workspace || workspace.isFlyout) return;

  // BLOCK_MOVE con oldParentId: FROM acaba de desconectarse de un bloque padre.
  // Esto ocurre ANTES de BLOCK_DRAG start, así que es el único momento donde podemos
  // saber de dónde venía FROM. Si el padre era un SELECT, marcamos el flag para que
  // al soltar FROM no se cree un SELECT duplicado.
  if (event.type === Blockly.Events.BLOCK_MOVE && event.oldParentId) {
    const oldParent = workspace.getBlockById(event.oldParentId);
    if (oldParent?.type === 'sql_select') {
      this._hadSelectParent = true;
    }
    return;
  }

  // Solo nos interesa el FIN del drag (isStart: false)
  if (event.type !== Blockly.Events.BLOCK_DRAG || event.isStart !== false) return;

  // ── Fin del drag ────────────────────────────────────────────────────────────

  // FROM se soltó sobre un SELECT existente → ya está conectado, nada que hacer
  if (this.previousConnection?.isConnected()) return;

  // FROM venía del workspace (estaba conectado a un SELECT) → no duplicar SELECT
  if (this._hadSelectParent) {
    this._hadSelectParent = false; // resetear para futuros drags de esta instancia
    return;
  }

  // FROM viene del toolbox (sin historial de padre) → crear SELECT

  // Guardar posición de FROM antes de crear SELECT.
  // newBlock coloca SELECT en (0,0). Al conectarlo encima de FROM, SELECT pasa a ser la raíz
  // del stack y arrastraría FROM a (0,0). Con fromPos calculamos cuánto mover SELECT
  // después del render para que FROM quede exactamente donde el usuario lo soltó.
  const fromPos = this.getRelativeToSurfaceXY();

  Blockly.Events.setGroup(true);
  try {
    const selectBlock = workspace.newBlock('sql_select');

    // Conectar antes de initSvg/render: Blockly calcula la posición al renderizar
    selectBlock.nextConnection.connect(this.previousConnection);

    selectBlock.initSvg();
    selectBlock.render();

    // Tras el render FROM se desplazó porque el stack ahora empieza en SELECT (0,0).
    // Calculamos el delta real y lo aplicamos a SELECT para devolver FROM a fromPos.
    const newFromPos = this.getRelativeToSurfaceXY();
    selectBlock.moveBy(fromPos.x - newFromPos.x, fromPos.y - newFromPos.y);
  } catch (e) {
    console.error('Error al auto-insertar SELECT sobre FROM:', e);
  } finally {
    Blockly.Events.setGroup(false);
  }
};