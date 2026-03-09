// sqla-app/src/js/blocks/extensions/fromContextMenu.js
// Extensión para agregar menú contextual a FROM blocks
// ── FROM SIMPLE → añadir JOINs ───────────────────────────────────────────────
import * as Blockly from 'blockly'; // ← necesario: ambas funciones usan Blockly.Extensions y Blockly.Events

export function registerFromContextMenu() {
    Blockly.Extensions.register('from_context_menu', function () {
        this.customContextMenu = function (options) {
            const block = this;
            const workspace = block.workspace;

            if (!workspace || workspace.isFlyout) return;

            options.push({ text: '─'.repeat(20), enabled: false, callback: function () { } });

            options.push({
                text: '➕ Add JOIN clause',
                enabled: true,
                callback: function () {
                    Blockly.Events.setGroup(true);
                    try {
                        const tableName = block.getFieldValue('TABLE_NAME');
                        const prevConn = block.previousConnection?.targetConnection ?? null;
                        const nextConn = block.nextConnection?.targetConnection ?? null;
                        const xy = block.getRelativeToSurfaceXY();

                        if (prevConn) prevConn.disconnect();
                        if (nextConn) nextConn.disconnect();
                        block.dispose(false);

                        const fromJoins = workspace.newBlock('sql_from');
                        fromJoins.setFieldValue(tableName, 'TABLE_NAME');
                        fromJoins.initSvg();
                        fromJoins.render();
                        fromJoins.moveBy(xy.x, xy.y);

                        if (prevConn) prevConn.connect(fromJoins.previousConnection);
                        if (nextConn) nextConn.connect(fromJoins.nextConnection);

                        // Auto-insertar primer JOIN (JOIN_ONCHANGE insertará el ComparisonBlock)
                        const joinBlock = workspace.newBlock('sql_join');
                        joinBlock.initSvg();
                        joinBlock.render();
                        fromJoins.getInput('JOINS').connection.connect(joinBlock.previousConnection);

                        fromJoins.select();
                    } catch (e) {
                        console.error('Error al añadir JOIN clause:', e);
                    } finally {
                        Blockly.Events.setGroup(false);
                    }
                }
            });
        };
    });
}

// ── FROM JOINS → quitar JOINs ────────────────────────────────────────────────
export function registerFromJoinsContextMenu() {
    Blockly.Extensions.register('from_joins_context_menu', function () {
        this.customContextMenu = function (options) {
            const block = this;
            const workspace = block.workspace;

            if (!workspace || workspace.isFlyout) return;

            options.push({ text: '─'.repeat(20), enabled: false, callback: function () { } });

            options.push({
                text: '❌ Remove JOIN clause',
                enabled: true,
                callback: function () {
                    Blockly.Events.setGroup(true);
                    try {
                        const tableName = block.getFieldValue('TABLE_NAME');
                        const prevConn = block.previousConnection?.targetConnection ?? null;
                        const nextConn = block.nextConnection?.targetConnection ?? null;
                        const xy = block.getRelativeToSurfaceXY();

                        if (prevConn) prevConn.disconnect();
                        if (nextConn) nextConn.disconnect();
                        block.dispose(true); // true → descarta también los JOINs hijos

                        const fromSimple = workspace.newBlock('sql_from_simple');
                        fromSimple.setFieldValue(tableName, 'TABLE_NAME');
                        fromSimple.initSvg();
                        fromSimple.render();
                        fromSimple.moveBy(xy.x, xy.y);

                        if (prevConn) prevConn.connect(fromSimple.previousConnection);
                        if (nextConn) nextConn.connect(fromSimple.nextConnection);

                        fromSimple.select();
                    } catch (e) {
                        console.error('Error al quitar JOIN clause:', e);
                    } finally {
                        Blockly.Events.setGroup(false);
                    }
                }
            });
        };
    });
}