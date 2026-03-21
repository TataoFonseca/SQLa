// sqla-app/src/js/blocks/extensions/orderByExpressionExtension.js
// Extensión onchange para sql_expression.
// Detecta si el bloque dml_ExpressionBlock.js (sql_expression) está conectado a sql_order_by y añade el dropdown DIRECTION (ASC/DESC).

import * as Blockly from 'blockly';

// Sube por todos los ancestros hasta encontrar el bloque raíz de la cadena
function getRootStatementParent(block) {
    let current = block.getParent();
    while (current) {
        if (!current.getParent()) return current;
        current = current.getParent();
    }
    return null;
}

function isInOrderByChain(block) {
    // const root = getRootStatementParent(block);
    // return root !== null && root.type === 'sql_order_by';
    let current = block;
    while (true) {
        // ¿El bloque actual se conecta a su padre via outputConnection?
        if (!current.outputConnection?.targetConnection) return false;

        const parent = current.outputConnection.targetConnection.getSourceBlock();
        if (!parent) return false;
        if (parent.type === 'sql_order_by') return true;

        // El padre también es una expresión encadenada, seguir subiendo
        current = parent;
    }
}

export function registerOrderByExpressionExtension() {
    Blockly.Extensions.register('order_by_expression_extension', function () {

        this.setOnChange(function (event) {
            if (event.type !== Blockly.Events.BLOCK_MOVE &&
                event.type !== Blockly.Events.BLOCK_CHANGE) return;

            const inOrderBy = isInOrderByChain(this);
            const hasDropdown = !!this.getField('DIRECTION');

            if (inOrderBy && !hasDropdown) {
                const nextInput = this.getInput('NEXT');
                if (nextInput) {
                    nextInput.insertFieldAt(1,
                        new Blockly.FieldDropdown([
                            ['ASC', 'ASC'],
                            ['DESC', 'DESC']
                        ]),
                        'DIRECTION'
                    );
                }
            }

            if (!inOrderBy && hasDropdown) {
                const nextInput = this.getInput('NEXT');
                if (nextInput && this.getField('DIRECTION')) {
                    nextInput.removeField('DIRECTION');
                }
            }
        });

    });
}