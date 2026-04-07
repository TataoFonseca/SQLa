// sqla-app/src/js/blocks/extensions/orderByExpressionExtension.js
//
// Extensión 'order_by_expression_extension' compartida por sql_expression y
// todos los aggregateFunctionblock normales (SUM, AVG, COUNT, MIN, MAX).
//
// Responsabilidad: detectar en tiempo de ejecución si el bloque está conectado (directamente o a través de una cadena de expresiones) a un sql_order_by y, según el resultado, mostrar u ocultar el dropdown DIRECTION (ASC/DESC) en el input NEXT del propio bloque.
//
// La extensión se aplica en el init de cada bloque (vía Blockly.Extensions.apply) y no requiere ninguna lógica adicional en el generador: los generadores simplemente leen block.getFieldValue('DIRECTION') y, si existe, lo anexan al código generado.
//
// Lo que NO hace esta extensión:
//   - No afecta a las variantes _having de los aggregates (no se les aplica).
//   - No modifica sql_expression_single.
//   - No interfiere con whereContextMenu, havingExpressionContextMenu ni
//     selectContextMenu.

import * as Blockly from 'blockly';

// ─── Navegación por la cadena de valor ───────────────────────────────────────
//
// isInOrderByChain sube por outputConnection.targetConnection.getSourceBlock()
// en lugar de getParent().
//
// ¿Por qué outputConnection y no getParent()?
// getParent() devuelve el bloque contenedor sin distinguir si la conexión es de
// valor o de statement. Si ORDER BY está encadenado con HAVING o GROUP BY vía
// statements, getParent() podría devolver esos bloques intermedios y confundir
// la detección. Recorrer únicamente outputConnection garantiza que solo se sigue
// la cadena de expresiones de valor, nunca las conexiones de statement.

function isInOrderByChain(block) {
  let current = block;
  while (true) {
    // Si el bloque no está conectado como valor a ningún padre, terminamos.
    if (!current.outputConnection?.targetConnection) return false;

    const parent = current.outputConnection.targetConnection.getSourceBlock();
    if (!parent) return false;

    // Encontramos el ORDER BY: el bloque sí pertenece a la cadena.
    if (parent.type === 'sql_order_by') return true;

    // El padre es otra expresión encadenada; seguir subiendo.
    current = parent;
  }
}

// ─── Gestión del dropdown DIRECTION ──────────────────────────────────────────

// Añade el dropdown ASC/DESC al input NEXT del bloque.
// Se llama solo cuando isInOrderByChain devuelve true y el campo aún no existe.
function addDirectionDropdown(block) {
  const nextInput = block.getInput('NEXT');
  if (!nextInput) return;
  nextInput.appendField(
    new Blockly.FieldDropdown([
      ['ASC', 'ASC'],
      ['DESC', 'DESC']
    ]),
    'DIRECTION'
  );
}

// Elimina el dropdown DIRECTION del input NEXT.
// Se llama cuando el bloque deja de estar dentro de un ORDER BY.
function removeDirectionDropdown(block) {
  const nextInput = block.getInput('NEXT');
  if (nextInput && block.getField('DIRECTION')) {
    nextInput.removeField('DIRECTION');
  }
}

// ─── Registro de la extensión ─────────────────────────────────────────────────
//
// Se registra una sola vez en Blockly y se aplica a cada bloque elegible en su
// propio init mediante Blockly.Extensions.apply('order_by_expression_extension', this, false).
// El handler de onChange escucha BLOCK_MOVE y BLOCK_CHANGE: ambos eventos cubren
// los casos de arrastrar el bloque hacia/desde ORDER BY y de cambios en la
// estructura de la cadena.

export function registerOrderByExpressionExtension() {
  Blockly.Extensions.register('order_by_expression_extension', function () {

    this.setOnChange(function (event) {
      if (event.type !== Blockly.Events.BLOCK_MOVE &&
        event.type !== Blockly.Events.BLOCK_CHANGE) return;

      const inOrderBy = isInOrderByChain(this);
      const hasDropdown = !!this.getField('DIRECTION');

      if (inOrderBy && !hasDropdown) {
        addDirectionDropdown(this);   // Entró en ORDER BY → mostrar DIRECTION
      }

      if (!inOrderBy && hasDropdown) {
        removeDirectionDropdown(this); // Salió de ORDER BY → ocultar DIRECTION
      }
    });

  });
}