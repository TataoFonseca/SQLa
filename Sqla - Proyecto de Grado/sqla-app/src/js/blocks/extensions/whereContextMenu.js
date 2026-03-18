// sqla-app/src/js/blocks/extensions/whereContextMenu.js

import * as Blockly from 'blockly';

export function registerWhereContextMenu() {
    Blockly.Extensions.register('where_context_menu', function () {

        this.customContextMenu = function (options) {
            const block = this;
            const workspace = block.workspace;

            if (!workspace || workspace.isFlyout) return;

            const condInput = block.getInput('CONDITION');
            const hasCondition = condInput?.connection?.isConnected();

            options.push({ text: '─'.repeat(20), enabled: false, callback: function () { } });

            function insertComparison(compType, leftDefault, rightDefault) {
                return function () {
                    Blockly.Events.setGroup(true);
                    try {
                        if (condInput?.connection?.isConnected()) return;

                        const compBlock = workspace.newBlock(compType);
                        compBlock.initSvg();
                        compBlock.render();

                        const leftExpr = workspace.newBlock('sql_expression_single');
                        leftExpr.setFieldValue(leftDefault, 'COLUMN');
                        leftExpr.initSvg();
                        leftExpr.render();

                        const rightExpr = workspace.newBlock('sql_expression_single');
                        rightExpr.setFieldValue(rightDefault, 'COLUMN');
                        rightExpr.initSvg();
                        rightExpr.render();

                        compBlock.getInput('LEFT').connection.connect(leftExpr.outputConnection);
                        compBlock.getInput('RIGHT').connection.connect(rightExpr.outputConnection);

                        condInput.connection.connect(compBlock.outputConnection);
                        compBlock.select();
                    } catch (e) {
                        console.error('Error al insertar condición en WHERE:', e);
                    } finally {
                        Blockly.Events.setGroup(false);
                    }
                };
            }

            if (!hasCondition) {
                options.push({
                    text: '➕ Add COMPARISON',
                    enabled: true,
                    // LEFT: columna a comparar | RIGHT: valor escalar
                    callback: insertComparison('sql_comparison', 'columna', 'valor')
                });
                options.push({
                    text: '➕ Add QUANTIFIED COMPARISON',
                    enabled: true,
                    // LEFT: columna | RIGHT: subquery o lista
                    callback: insertComparison('sql_quantified_comparison', 'columna', 'subquery')
                });
                options.push({
                    text: '➕ Add MEMBERSHIP',
                    enabled: true,
                    // LEFT: columna | RIGHT: lista de valores
                    callback: insertComparison('sql_membership', 'columna', 'valor1, valor2')
                });
            } else {
                options.push({
                    text: '❌ Remove condition',
                    enabled: true,
                    callback: function () {
                        Blockly.Events.setGroup(true);
                        try {
                            condInput.connection.targetBlock()?.dispose(true);
                        } catch (e) {
                            console.error('Error al quitar condición del WHERE:', e);
                        } finally {
                            Blockly.Events.setGroup(false);
                        }
                    }
                });
            }
        };
    });
}
