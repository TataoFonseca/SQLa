import pkg from "node-sql-parser";
const { Parser } = pkg;

// Crear una instancia del parser
const parser = new Parser();

/**
 * Transforma el AST para inyectar el schema en todas las tablas
 */
export function injectSchemaInAST(ast, schemaName) {
    if (!ast || !schemaName) return ast;

    function processNode(node) {
        if (!node) return;

        // CREATE TABLE
        if (node.type === 'create' && node.keyword === 'table') {
            if (node.table && Array.isArray(node.table)) {
                node.table.forEach(tableItem => {
                    if (tableItem.table && !tableItem.db) {
                        tableItem.db = schemaName;
                    }
                });
            }
        }

        // INSERT INTO
        if (node.type === 'insert') {
            if (node.table && Array.isArray(node.table)) {
                node.table.forEach(tableItem => {
                    if (tableItem.table && !tableItem.db) {
                        tableItem.db = schemaName;
                        console.log('✅ Schema inyectado en INSERT:', tableItem.db);
                    }
                });
            }
        }
        // UPDATE 
        if (node.type === 'update') {
            if (node.table && Array.isArray(node.table)) {
                node.table.forEach(tableItem => {
                    if (typeof tableItem === 'object') {
                        if (typeof tableItem.table === 'string') {
                            // Caso simple: table es string
                            const tableName = tableItem.table;
                            tableItem.db = schemaName;      // El schema va en db
                            tableItem.table = tableName;    // El nombre de tabla en table
                            console.log('✅ Schema inyectado en UPDATE (string):', schemaName);
                        }
                        else if (typeof tableItem.table === 'object') {
                            // Si ya es objeto, pero tiene estructura anidada
                            if (tableItem.table.table) {
                                // Estructura actual: { table: { db:..., table:... } }
                                // Debe ser: { db:..., table:... }
                                tableItem.db = tableItem.table.db || schemaName;
                                tableItem.table = tableItem.table.table;
                                console.log('✅ Schema inyectado en UPDATE (objeto aplanado):', tableItem.db);
                            }
                        }
                    }
                });
            }
        }
        // SELECT (FROM clause) 
        if (node.from) {
            if (Array.isArray(node.from)) {
                node.from.forEach(item => {
                    // Lista de schemas del sistema que NO deben modificarse
                    const systemSchemas = ['INFORMATION_SCHEMA', 'sys', 'dbo'];

                    // Si ya tiene un db/schema explícito y está en la lista de systemSchemas, no lo modificamos
                    if (item.db && systemSchemas.includes(item.db)) {
                        console.log('⏭️ Saltando schema del sistema:', item.db);
                        return; // Salir, no modificar
                    }

                    if (item.table) {
                        if (typeof item.table === 'string') {
                            // Caso simple: table es string
                            const tableName = item.table;
                            item.db = schemaName;      // El schema va en db
                            item.table = tableName;    // El nombre de tabla en table
                            console.log('✅ Schema inyectado en SELECT (string):', schemaName);
                        }
                        else if (typeof item.table === 'object') {
                            // Si ya es objeto, pero tiene estructura anidada
                            if (item.table.table) {
                                item.db = item.table.db || schemaName;
                                item.table = item.table.table;
                                console.log('✅ Schema inyectado en SELECT (objeto):', item.db);
                            }
                        }
                    }
                });
            }
        }

        // ALTER TABLE
        if (node.type === 'alter' && node.keyword === 'table') {
            if (node.table && Array.isArray(node.table)) {
                node.table.forEach(tableItem => {
                    if (typeof tableItem === 'object') {
                        if (typeof tableItem.table === 'string') {
                            // Caso simple: table es string
                            const tableName = tableItem.table;
                            tableItem.db = schemaName;      // El schema va en db
                            tableItem.table = tableName;    // El nombre de tabla en table
                            console.log('✅ Schema inyectado en ALTER TABLE:', schemaName);
                        }
                    }
                });
            }
        }
        // DELETE
        if (node.type === 'delete') {
            if (node.from) {
                if (typeof node.from === 'object' && node.from.table) {
                    if (typeof node.from.table === 'object' && !node.from.table.db) {
                        node.from.table.db = schemaName;
                    } else if (typeof node.from.table === 'string' && !node.from.table.includes('.')) {
                        node.from.table = `${schemaName}.${node.from.table}`;
                    }
                }
            }
        }

        // JOIN clauses
        if (node.join) {
            const joins = Array.isArray(node.join) ? node.join : [node.join];
            joins.forEach(join => {
                if (join.table) {
                    if (typeof join.table === 'object' && join.table.table && !join.table.db) {
                        join.table.db = schemaName;
                    } else if (typeof join.table === 'string' && !join.table.includes('.')) {
                        join.table = `${schemaName}.${join.table}`;
                    }
                }
            });
        }

        // Recursivamente procesar hijos
        Object.keys(node).forEach(key => {
            if (node[key] && typeof node[key] === 'object') {
                processNode(node[key]);
            }
        });
    }

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

        console.log('🔧 Transformando SQL:', sql);
        console.log('🔧 Con schema:', schemaName);

        // Parsear a AST usando la instancia del parser
        let ast = parser.astify(sql, opt);
        console.log(' AST generado:', JSON.stringify(ast, null, 2));

        // Inyectar schema
        ast = injectSchemaInAST(ast, schemaName);
        console.log(' AST transformado:', JSON.stringify(ast, null, 2));

        // Reconstruir SQL usando la instancia del parser
        const transformedSQL = parser.sqlify(ast, opt);
        console.log('✅ SQL transformado:', transformedSQL);

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
            transformed: sql, // Devolvemos el original si hay error
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

        // Recursivamente procesar hijos
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