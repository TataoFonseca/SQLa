import pkg from "node-sql-parser";
const { Parser } = pkg;

// Crear una instancia del parser
const parser = new Parser();

/**
 * Genera un nombre único para la tabla basado en el nombre lógico y el schema
 */
function generateUniqueTableName(logicalName, schemaName) {
    const shortSessionId = schemaName.replace('session_', '').substring(0, 8);
    return `${logicalName}_${shortSessionId}`;
}

/**
 * Procesa recursivamente cualquier referencia a tablas en el AST
 */
function processTableReference(tableRef, schemaName, context) {
    if (!tableRef) return;

    // Si es un array, procesar cada elemento
    if (Array.isArray(tableRef)) {
        tableRef.forEach(ref => processTableReference(ref, schemaName, context));
        return;
    }

    // Si es un objeto con propiedad table
    if (typeof tableRef === 'object') {
        // Si tiene db (schema) y es del sistema, no modificar
        const systemSchemas = ['INFORMATION_SCHEMA', 'sys', 'dbo'];
        if (tableRef.db && systemSchemas.includes(tableRef.db)) {
            console.log(`⏭️ Saltando schema del sistema en ${context}:`, tableRef.db);
            return;
        }

        // Procesar el nombre de la tabla si es string
        if (typeof tableRef.table === 'string' && !tableRef.table.includes('_') && !systemSchemas.includes(tableRef.table)) {
            // Verificar si ya tiene el formato único (contiene _ + sessionId)
            const shortSessionId = schemaName.replace('session_', '').substring(0, 8);
            const expectedSuffix = `_${shortSessionId}`;

            if (!tableRef.table.endsWith(expectedSuffix)) {
                const originalName = tableRef.table;
                tableRef.table = generateUniqueTableName(originalName, schemaName);
                console.log(` Nombre único generado en ${context}: ${originalName} → ${tableRef.table}`);
            }
        }

        // Inyectar schema si no tiene
        if (!tableRef.db) {
            tableRef.db = schemaName;
            console.log(` Schema inyectado en ${context}:`, schemaName);
        }

        // Procesar recursivamente si hay más niveles
        if (tableRef.table && typeof tableRef.table === 'object') {
            processTableReference(tableRef.table, schemaName, context);
        }
    }
}

/**
 * Transforma el AST para inyectar el schema en todas las tablas
 */
export function injectSchemaInAST(ast, schemaName) {
    if (!ast || !schemaName) return ast;

    function processNode(node) {
        if (!node) return;

        // ==========================================
        // CREATE TABLE
        // ==========================================
        if (node.type === 'create' && node.keyword === 'table') {
            // Procesar la tabla principal
            if (node.table && Array.isArray(node.table)) {
                node.table.forEach(tableItem => {
                    if (tableItem.table && !tableItem.db) {
                        // Generar nombre único
                        const userTableName = tableItem.table;
                        const uniqueTableName = generateUniqueTableName(userTableName, schemaName);

                        // Guardar en el AST
                        tableItem.table = uniqueTableName;
                        tableItem.db = schemaName;

                        console.log(`✅ Tabla renombrada en CREATE: ${userTableName} → ${uniqueTableName}`);
                    }
                });
            }

            // Procesar FOREIGN KEY dentro de CREATE TABLE
            if (node.create_definitions && Array.isArray(node.create_definitions)) {
                node.create_definitions.forEach(def => {
                    if (def.resource === 'constraint' && def.constraint_type === 'FOREIGN KEY') {
                        if (def.reference_definition && def.reference_definition.table) {
                            def.reference_definition.table.forEach(refTable => {
                                if (!refTable.db) {
                                    // También renombrar la tabla referenciada
                                    const userTableName = refTable.table;
                                    const uniqueTableName = generateUniqueTableName(userTableName, schemaName);
                                    refTable.table = uniqueTableName;
                                    refTable.db = schemaName;
                                    console.log(`✅ Tabla referenciada renombrada en CREATE: ${userTableName} → ${uniqueTableName}`);
                                }
                            });
                        }
                    }
                });
            }
        }

        // ==========================================
        // ALTER TABLE (incluye ADD CONSTRAINT)
        // ==========================================
        if (node.type === 'alter' && node.keyword === 'table') {
            // Procesar la tabla principal del ALTER
            if (node.table) {
                processTableReference(node.table, schemaName, 'ALTER TABLE (principal)');
            }

            // Procesar expresiones dentro de ALTER
            if (node.expr && Array.isArray(node.expr)) {
                node.expr.forEach(expr => {
                    // ADD CONSTRAINT
                    if (expr.resource === 'constraint' || expr.action === 'add') {
                        // FOREIGN KEY
                        if (expr.create_definitions && expr.create_definitions.reference_definition) {
                            const refDef = expr.create_definitions.reference_definition;
                            if (refDef.table) {
                                processTableReference(
                                    refDef.table,
                                    schemaName,
                                    'FOREIGN KEY (ALTER TABLE)'
                                );
                            }
                        }
                    }
                });
            }
        }

        // ==========================================
        // INSERT INTO
        // ==========================================
        if (node.type === 'insert') {
            if (node.table) {
                processTableReference(node.table, schemaName, 'INSERT');
            }
        }

        // ==========================================
        // UPDATE
        // ==========================================
        if (node.type === 'update') {
            if (node.table) {
                processTableReference(node.table, schemaName, 'UPDATE');
            }
        }

        // ==========================================
        // DELETE
        // ==========================================
        if (node.type === 'delete') {
            if (node.from) {
                processTableReference(node.from, schemaName, 'DELETE');
            }
        }

        // ==========================================
        // SELECT (FROM, JOIN, etc.)
        // ==========================================
        if (node.from) {
            processTableReference(node.from, schemaName, 'SELECT (FROM)');
        }

        // JOIN clauses
        if (node.join) {
            const joins = Array.isArray(node.join) ? node.join : [node.join];
            joins.forEach(join => {
                if (join.table) {
                    processTableReference(join.table, schemaName, 'JOIN');
                }
            });
        }

        // ==========================================
        // DROP TABLE
        // ==========================================
        if (node.type === 'drop' && node.keyword === 'table') {
            if (node.name && Array.isArray(node.name)) {
                node.name.forEach(tableItem => {
                    if (tableItem.table) {
                        processTableReference(tableItem, schemaName, 'DROP TABLE');
                    }
                });
            }
        }

        // ==========================================
        // Recursivamente procesar hijos
        // ==========================================
        Object.keys(node).forEach(key => {
            if (node[key] && typeof node[key] === 'object') {
                processNode(node[key]);
            }
        });
    }

    // Procesar el AST completo
    if (Array.isArray(ast)) {
        ast.forEach(item => processNode(item));
    } else {
        processNode(ast);
    }

    return ast;
}

/**
 * Transforma SQL directamente inyectando el schema
 */
export function transformSQL(sql, schemaName) {
    try {
        const opt = { database: 'Postgresql' };

        console.log(' Transformando SQL:', sql);
        console.log(' Con schema:', schemaName);

        // Parsear a AST usando la instancia del parser
        let ast = parser.astify(sql, opt);
        console.log(' AST generado:', JSON.stringify(ast, null, 2));

        // Inyectar schema y nombres únicos
        ast = injectSchemaInAST(ast, schemaName);
        console.log(' AST transformado:', JSON.stringify(ast, null, 2));

        // Reconstruir SQL usando la instancia del parser
        const transformedSQL = parser.sqlify(ast, opt);
        console.log(' SQL transformado:', transformedSQL);

        return {
            original: sql,
            transformed: transformedSQL,
            ast,
            success: true
        };
    } catch (error) {
        console.error(' Error transformando SQL:', error);
        return {
            original: sql,
            transformed: sql,
            ast: null,
            error: error.message,
            success: false
        };
    }
}

/**
 * Tipos de queries que necesitan transformación
 */
export const QUERY_TYPES = {
    CREATE_TABLE: 'create_table',
    SELECT: 'select',
    INSERT: 'insert',
    UPDATE: 'update',
    DELETE: 'delete',
    ALTER_TABLE: 'alter_table',
    DROP_TABLE: 'drop_table',
    TRUNCATE: 'truncate'
};

/**
 * Detecta si una query necesita transformación de schema
 */
export function needsSchemaInjection(ast) {
    if (!ast) return false;

    const types = [];

    function detect(node) {
        if (!node) return;

        if (node.type === 'create' && node.kind === 'table') {
            types.push(QUERY_TYPES.CREATE_TABLE);
        } else if (node.type === 'select') {
            types.push(QUERY_TYPES.SELECT);
        } else if (node.type === 'insert') {
            types.push(QUERY_TYPES.INSERT);
        } else if (node.type === 'update') {
            types.push(QUERY_TYPES.UPDATE);
        } else if (node.type === 'delete') {
            types.push(QUERY_TYPES.DELETE);
        } else if (node.type === 'alter') {
            types.push(QUERY_TYPES.ALTER_TABLE);
        } else if (node.type === 'drop') {
            types.push(QUERY_TYPES.DROP_TABLE);
        } else if (node.type === 'truncate') {
            types.push(QUERY_TYPES.TRUNCATE);
        }

        Object.keys(node).forEach(key => {
            if (node[key] && typeof node[key] === 'object') {
                detect(node[key]);
            }
        });
    }

    if (Array.isArray(ast)) {
        ast.forEach(item => detect(item));
    } else {
        detect(ast);
    }

    return types.length > 0;
}