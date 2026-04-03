// sqla-app/src/js/blocks/dml_JoinBlock.js
// Bloque JOIN: tipo seleccionable + tabla + condición ON via bloque de comparación
import * as Blockly from 'blockly'; // Necesario: JOIN_ONCHANGE usa Blockly.Events directamente


export const JOIN_DEFINITION = {
    "type": "sql_join",
    "message0": "%1 JOIN %2 ON %3",
    "args0": [
        {
            // Dropdown para elegir el tipo de JOIN
            "type": "field_dropdown",
            "name": "JOIN_TYPE",
            "options": [
                ["INNER", "INNER"],
                ["LEFT", "LEFT"],
                ["RIGHT", "RIGHT"],
                ["FULL OUTER", "FULL OUTER"]
            ]
        },
        {
            // Nombre de la tabla a unir
            "type": "field_input",
            "name": "JOIN_TABLE",
            "text": "otra_tabla"
        },
        {
            // Input de valor: aquí se conecta un dml_ComparisonBlock (output "Condition")
            "type": "input_value",
            "name": "ON_CONDITION",
            "check": ["Condition"]
        }
    ],
    // Se encadena dentro de la boquilla JOINS del FROM (o con otro JOIN)
    "previousStatement": "SQL_JOIN",
    "nextStatement": "SQL_JOIN",
    "colour": 200,
    "tooltip": "Une otra tabla. El bloque de Comparación en la condición ON se auto-inserta.",
    "helpUrl": ""
};

export const JOIN_GENERATOR = function (block, generator) {
    const joinType = block.getFieldValue('JOIN_TYPE');
    const joinTable = block.getFieldValue('JOIN_TABLE');

    // Obtiene el código del bloque de comparación conectado en ON
    const onCondition = generator.valueToCode(
        block,
        'ON_CONDITION',
        0  // ORDER_ATOMIC — las comparaciones no necesitan paréntesis extra
    );

    if (!onCondition) {
        // ── Sin condición ON: colorear bloque de rojo
        block.setColour('#c0392b');
        // Mostrar aviso de error en el SQL Output
        const sqlDiv = document.getElementById('sqlOutput');
        if (sqlDiv) {
            sqlDiv.style.display = 'block';
            sqlDiv.innerHTML = `
                <h2>Error en Bloque JOIN</h2>
                <pre style="color:#ff5555;">
⚠️ El bloque JOIN con la tabla '${joinTable}' no tiene condición ON.
Conecta un bloque de comparación al conector ON del JOIN o has click izquierdo en el para añadirlo</pre>
            `;
        }

    } else {
        block.setColour(200);
        // Limpiar el mensaje si ya tiene condición
        const sqlDiv = document.getElementById('sqlOutput');
        if (sqlDiv && sqlDiv.innerHTML.includes('no tiene condición ON')) {
            sqlDiv.innerHTML = 'Solucionado';
            sqlDiv.style.display = 'none';
        }
    }

    // Si no hay condición conectada se manda un aviso al usuario
    const onPart = onCondition ? onCondition : '/* condición ON requerida */';

    const code = `${joinType} JOIN ${joinTable} ON ${onPart}\n`;
    return code;
};

// onchange: auto-inserta ComparisonBlock + 2 ExpressionSingle la primera vez
export const JOIN_ONCHANGE = function (event) {
    // console.log('JOIN onchange:', event.type, '| event.blockId:', event.blockId, '| this.id:', this.id);
    // Solo actuar en el evento de creación del bloque
    if (event.type !== Blockly.Events.BLOCK_CREATE) return;
    if (event.blockId !== this.id) return;

    const workspace = this.workspace;
    if (!workspace || workspace.isFlyout) return;

    const onInput = this.getInput('ON_CONDITION');
    if (!onInput) return;

    // Si ya tiene algo conectado no hacer nada
    if (onInput.connection.isConnected()) return;

    Blockly.Events.setGroup(true);
    try {
        // Crear ComparisonBlock
        const comp = workspace.newBlock('sql_comparison');
        comp.initSvg();
        comp.render();

        // Crear ExpressionSingle para LEFT
        const leftExpr = workspace.newBlock('sql_expression_single');
        leftExpr.setFieldValue('tabla.columna', 'COLUMN');
        leftExpr.initSvg();
        leftExpr.render();

        // Crear ExpressionSingle para RIGHT
        const rightExpr = workspace.newBlock('sql_expression_single');
        rightExpr.setFieldValue('tabla.columna', 'COLUMN');
        rightExpr.initSvg();
        rightExpr.render();

        // Conectar LEFT y RIGHT al ComparisonBlock
        comp.getInput('LEFT').connection.connect(leftExpr.outputConnection);
        comp.getInput('RIGHT').connection.connect(rightExpr.outputConnection);

        // Conectar ComparisonBlock al ON del JOIN
        onInput.connection.connect(comp.outputConnection);

    } catch (e) {
        console.error('Error al auto-insertar condición ON:', e);
    } finally {
        Blockly.Events.setGroup(false);
    }
};