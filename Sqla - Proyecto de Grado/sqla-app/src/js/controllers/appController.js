// src/js/controllers/appController.js

import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
// mermaid: eliminado — el tab DML pasó a Cytoscape (renderERD) y el tab DDL usa HTML cards (updateDDLDiagram)
import { chinookSchema } from '../data/chinookSchema.js';
import { apiService } from '../services/apiService.js';

// === Importe de Bloques===
// ==== BLOQUES DDL
import { CREATE_TABLE_DEFINITION, CREATE_TABLE_GENERATOR } from '../blocks/ddl_CreateTableBlock.js';
import { columnDefinitionBlockInit, COLUMN_GENERATOR } from '../blocks/ddl_ColumnDefinitionBlock.js';
import { columnPrimaryKeyBlockInit, COLUMN_PRIMARY_KEY_GENERATOR } from '../blocks/ddl_ColumnPrimaryKey.js';

// Menu contextual para PRIMARY KEY en bloque de definición de columna
import { registerPrimaryKeyContextMenu } from '../blocks/extensions/primaryKeyContextMenu.js';

// CONSTRAINTS DE COLUMNA
import {
  columnIdentityBlockInit, COLUMN_IDENTITY_GENERATOR,
  columnNotNullBlockInit, COLUMN_NOT_NULL_GENERATOR,
  columnUniqueBlockInit, COLUMN_UNIQUE_GENERATOR,
  columnDefaultBlockInit, COLUMN_DEFAULT_GENERATOR,
  columnCheckBlockInit, COLUMN_CHECK_GENERATOR,
  columnReferencesBlockInit, COLUMN_REFERENCES_GENERATOR,
} from '../blocks/ddl_ColumnConstraints.js';


// BLOQUES DML
import { selectBlockDefinition, SELECT_GENERATOR, } from '../blocks/dml_SelectBlock.js';

import { FROM_SIMPLE_DEFINITION, FROM_SIMPLE_GENERATOR } from '../blocks/dml_FromSimpleBlock.js'; // (Agregado) FROM simple sin soporte de JOINs (FromSimpleBlock.js)
import { FROM_DEFINITION, FROM_GENERATOR, FROM_ONCHANGE } from '../blocks/dml_FromBlock.js'; // FROM con soporte de JOINs (FromBlock.js)

import { WHERE_DEFINITION, WHERE_GENERATOR } from '../blocks/dml_WhereBlock.js';
import { registerWhereContextMenu } from '../blocks/extensions/whereContextMenu.js';


// BLOQUE DE MENÚ CONTEXTUAL PARA FROM (FromSimpleBlock.js y FromBlock.js)
import { registerFromContextMenu, registerFromJoinsContextMenu } from '../blocks/extensions/fromContextMenu.js';

//BLOQUES DML JOIN
import { JOIN_DEFINITION, JOIN_GENERATOR, JOIN_ONCHANGE } from '../blocks/dml_JoinBlock.js';

import {
  expressionBlockDefinition, // cambió de EXPRESSION_DEFINITION, a  expressionBlockDefinition, para usar el patrón init y así poder agregar el input NEXT necesario para la coma dinámica, pero el generador y el onchange se mantienen igual
  EXPRESSION_GENERATOR,
  EXPRESSION_ONCHANGE // Onchange para manejar la coma dinámica en el bloque de expresión
} from '../blocks/dml_ExpressionBlock.js';

import { DISTINCT_DEFINITION, DISTINCT_GENERATOR } from '../blocks/dml_DistinctBlock.js';
import { TOP_DEFINITION, TOP_GENERATOR } from '../blocks/dml_TopBlock.js';

import { registerSelectContextMenu } from '../blocks/extensions/selectContextMenu.js';


// BLOQUE DE EXPRESSION dentro de funciones de agregación (sin NEXT, sin onchange ¡ELIMINADO!
// import { AGGREGATE_EXPRESSION_DEFINITION, AGGREGATE_EXPRESSION_GENERATOR, } from '../blocks/dml_aggregateFunctionsExpressionBlock.js';

import {
  aggregateFunction_Sum_BlockDefinition, SUM_GENERATOR,
  aggregateFunction_Avg_BlockDefinition, AVG_GENERATOR,
  aggregateFunction_Count_BlockDefinition, COUNT_GENERATOR,
  aggregateFunction_Min_BlockDefinition, MIN_GENERATOR,
  aggregateFunction_Max_BlockDefinition, MAX_GENERATOR,
  aggregateFunction_Sum_Having_BlockDefinition, SUM_HAVING_GENERATOR,
  aggregateFunction_Avg_Having_BlockDefinition, AVG_HAVING_GENERATOR,
  aggregateFunction_Count_Having_BlockDefinition, COUNT_HAVING_GENERATOR,
  aggregateFunction_Min_Having_BlockDefinition, MIN_HAVING_GENERATOR,
  aggregateFunction_Max_Having_BlockDefinition, MAX_HAVING_GENERATOR,
  createAggregateFunctionOnChange
} from '../blocks/dml_aggregateFunctionsBlock.js';

// EXTENSIÓN DE MENÚ CONTEXTUAL PARA FUNCIONES DE AGREGACIÓN - CAMBIÓ DE registerAggregateFunctionExpressionContextMenu a registerAggregateFunctionContextMenu
import { registerAggregateFunctionContextMenu } from '../blocks/extensions/aggregateFunctionContextMenu.js';

import { GROUPBY_DEFINITION, GROUPBY_GENERATOR, GROUPBY_ONCHANGE } from '../blocks/dml_GroupByBlock.js';
import { GROUPBY_COLUMN_DEFINITION, GROUPBY_COLUMN_GENERATOR, GROUPBY_COLUMN_ONCHANGE } from '../blocks/dml_GroupByColumnBlock.js';

import { HAVING_DEFINITION, HAVING_GENERATOR, HAVING_ONCHANGE } from '../blocks/dml_HavingBlock.js';

// EXTENSIÓN PARA MENU CONTEXTUAL DE EXPRESIONES EN HAVING
import { registerHavingExpressionContextMenu } from '../blocks/extensions/havingExpressionContextMenu.js';

import { EXPRESSION_SINGLE_DEFINITION, EXPRESSION_SINGLE_GENERATOR } from '../blocks/dml_ExpressionSingleBlock.js';

import { COMPARISON_DEFINITION, COMPARISON_GENERATOR } from '../blocks/dml_ComparisonBlock.js';
import { QUANTIFIED_COMPARISON_DEFINITION, QUANTIFIED_COMPARISON_GENERATOR } from '../blocks/dml_QuantifiedComparisonBlock.js';
import { MEMBERSHIP_DEFINITION, MEMBERSHIP_GENERATOR } from '../blocks/dml_MembershipBlock.js';

//DML: ORDER BY
import { ORDER_BY_DEFINITION, ORDER_BY_GENERATOR } from '../blocks/dml_OrderByBlock.js'; //Bloque ORDER BY
// import { orderByExpressionBlockDefinition, ORDERBY_EXPRESSION_GENERATOR } from '../blocks/dml_OrderByExpressionBlock.js'; //Bloque ORDER BY Expression
import { registerOrderByExpressionExtension } from '../blocks/extensions/orderByExpressionExtenssion.js'; //Extensión para ORDER BY Expression


// mermaid.initialize: eliminado junto con el import de mermaid

export const AppController = {
  workspace: null,
  // Antes: _mermaidDebounceTimer — renombrado a _erdDebounceTimer porque debouncea el ERD en general (DDL + DML), no solo Mermaid
  _erdDebounceTimer: null,
  _activeErdTab: 'ddl',
  _cytoscapeInstance: null,
  _cardEls: null,

  init: function () {

    // ── Verificar sesión activa ──────────────────────────────────
    const { sessionId } = apiService.getCurrentSession();
    const storedId = localStorage.getItem('sqlSessionId');

    if (!sessionId && !storedId) {
      // Sin sesión → redirigir al inicio
      window.location.href = '/index.html';
      return;
    }

    // Sincronizar apiService con lo guardado en localStorage si es necesario
    if (!sessionId && storedId) {
      apiService.currentSessionId = storedId;
      apiService.currentSchema = localStorage.getItem('sqlSchema');
    }

    // Mostrar UUID en el campo de sesión del header
    const sessionInput = document.getElementById('sessionNumber');
    if (sessionInput) {
      const displayId = sessionId || storedId;
      sessionInput.value = displayId;
    }

    // === DEFINIR ORDEN DE OPERACIONES PARA EL GENERADOR ===
    javascriptGenerator.ORDER_ATOMIC = 0;
    javascriptGenerator.ORDER_FUNCTION_CALL = 1;
    javascriptGenerator.ORDER_MEMBER = 2;
    javascriptGenerator.ORDER_MULTIPLICATION = 3;
    javascriptGenerator.ORDER_DIVISION = 3;
    javascriptGenerator.ORDER_ADDITION = 4;
    javascriptGenerator.ORDER_SUBTRACTION = 4;
    javascriptGenerator.ORDER_NONE = 99;

    //REGISTRO DE EXTENSION DE MENÚ CONTEXTUAL PARA PRIMARY KEY EN BLOQUE DE DEFINICIÓN DE COLUMNA
    registerPrimaryKeyContextMenu();

    //REGISTRO DEL MENÚ CONTEXTUAL PARA EL BLOQUE DE EXPRESIÓN de SELECT (ANTES DE LOS BLOQUES)
    registerSelectContextMenu();
    registerFromContextMenu();
    registerFromJoinsContextMenu();

    //REGISTRO DEL MENÚ CONTEXTUAL PARA WHERE
    registerWhereContextMenu();

    //REGISTRO DEL MENÚ CONTEXTUAL DE EXTENSIÓN PARA *--*EXPRESIONES EN*--* FUNCIONES DE AGREGACIÓN
    registerAggregateFunctionContextMenu();

    //REGISTRO DEL MENÚ CONTEXTUAL DE EXTENSIÓN PARA EXPRESIONES EN HAVING
    registerHavingExpressionContextMenu();

    //REGISTRO DE EXTENSIÓN DE MENÚ CONTEXTUAL PARA ORDER BY EXPRESSION
    registerOrderByExpressionExtension();


    // PASO 2: REGISTRO DE BLOQUES (JSON) ===
    //Bloques sin OnChange, se usa defineBlocksWithJsonArray
    Blockly.defineBlocksWithJsonArray([
      // DDL
      CREATE_TABLE_DEFINITION,

      // DML
      // SELECT_DEFINITION, //Eliminado, estructura cambiada a init, para ser compatible con Extensiones 
      WHERE_DEFINITION, //Agregado WHERE (WhereBlock.js)


      // DML: DISTINCT Y TOP
      DISTINCT_DEFINITION,
      TOP_DEFINITION,

      // DML: EXPRESSION SINGLE
      EXPRESSION_SINGLE_DEFINITION,

      // DML: COMPARACIONES
      COMPARISON_DEFINITION,
      QUANTIFIED_COMPARISON_DEFINITION,
      MEMBERSHIP_DEFINITION,

    ]);

    //============== Bloques con onchange, estos bloques requieren lógica adicional en el menú contextual o generación de código, se registran manualmente con Blockly.Blocks

    Blockly.Blocks['sql_select'] = selectBlockDefinition(Blockly);

    // DML: HAVING — registro manual para incluir onchange de auto-transformación Expression → ExpressionSingle
    Blockly.Blocks['sql_having'] = {
      init: function () { this.jsonInit(HAVING_DEFINITION); },
      onchange: HAVING_ONCHANGE
    };

    // DML: FROM (con y sin JOINs) — registro manual para incluir onchange de auto-attach SELECT
    Blockly.Blocks['sql_from_simple'] = {
      init: function () { this.jsonInit(FROM_SIMPLE_DEFINITION); },
      onchange: FROM_ONCHANGE
    };
    Blockly.Blocks['sql_from'] = {
      init: function () { this.jsonInit(FROM_DEFINITION); },
      onchange: FROM_ONCHANGE
    };

    // DDL: PRIMARY KEY (bloque de constraint para columna primaria)
    Blockly.Blocks['sql_column_primary_key'] = columnPrimaryKeyBlockInit(Blockly);

    // DDL: DEFINICIÓN DE COLUMNA 
    Blockly.Blocks['sql_column_definition'] = {
      ...columnDefinitionBlockInit(Blockly)
    };

    // DDL: CONSTRAINTS DE COLUMNA
    Blockly.Blocks['sql_column_identity'] = columnIdentityBlockInit(Blockly);
    Blockly.Blocks['sql_column_not_null'] = columnNotNullBlockInit(Blockly);
    Blockly.Blocks['sql_column_unique'] = columnUniqueBlockInit(Blockly);
    Blockly.Blocks['sql_column_default'] = columnDefaultBlockInit(Blockly);
    Blockly.Blocks['sql_column_check'] = columnCheckBlockInit(Blockly);
    Blockly.Blocks['sql_column_references'] = columnReferencesBlockInit(Blockly);

    // BLOQUES CON ONCHANGE, esta función agrega contenido dinámico a los bloques
    // (coma dinámica) → registro manual con Blockly.Blocks
    // DML: EXPRESSION CON EXPRESSION_ONCHANGE (MENÚ CONTEXTUAL para DISTINCT/TOP), Actualizado para usar el patrón init en lugar de jsonInit, para poder agregar el input NEXT necesario para la coma dinámica, pero el generador y el onchange se mantienen igual
    Blockly.Blocks['sql_expression'] = {
      ...expressionBlockDefinition(Blockly),
      onchange: EXPRESSION_ONCHANGE
    };

    // ¡ELIMINADO!
    // Blockly.Blocks['sql_aggregate_expression'] = {
    //   init: function () { this.jsonInit(AGGREGATE_EXPRESSION_DEFINITION); }, // Bloque de expresión para funciones de agregación
    // };

    Blockly.Blocks['sql_join'] = {
      init: function () { this.jsonInit(JOIN_DEFINITION); },
      onchange: JOIN_ONCHANGE
    };

    const AGGREGATE_FUNCTION_ONCHANGE = createAggregateFunctionOnChange(Blockly);

    //DML: FUNCIONES DE AGREGACIÓN (con onchange)
    Blockly.Blocks['sql_sum'] = {
      ...aggregateFunction_Sum_BlockDefinition(Blockly),
      onchange: AGGREGATE_FUNCTION_ONCHANGE
    };

    Blockly.Blocks['sql_avg'] = {
      ...aggregateFunction_Avg_BlockDefinition(Blockly),
      onchange: AGGREGATE_FUNCTION_ONCHANGE
    };

    Blockly.Blocks['sql_count'] = {
      ...aggregateFunction_Count_BlockDefinition(Blockly),
      onchange: AGGREGATE_FUNCTION_ONCHANGE
    };

    Blockly.Blocks['sql_min'] = {
      ...aggregateFunction_Min_BlockDefinition(Blockly),
      onchange: AGGREGATE_FUNCTION_ONCHANGE
    };

    Blockly.Blocks['sql_max'] = {
      ...aggregateFunction_Max_BlockDefinition(Blockly),
      onchange: AGGREGATE_FUNCTION_ONCHANGE
    };

    //DML: FUNCIONES DE AGREGACIÓN (con onchange) y sin coma dinamica para HAVING (NEXT)
    Blockly.Blocks['sql_sum_having'] = {
      ...aggregateFunction_Sum_Having_BlockDefinition(Blockly),
      onchange: AGGREGATE_FUNCTION_ONCHANGE
    };
    Blockly.Blocks['sql_avg_having'] = {
      ...aggregateFunction_Avg_Having_BlockDefinition(Blockly),
      onchange: AGGREGATE_FUNCTION_ONCHANGE
    };
    Blockly.Blocks['sql_count_having'] = {
      ...aggregateFunction_Count_Having_BlockDefinition(Blockly),
      onchange: AGGREGATE_FUNCTION_ONCHANGE
    };
    Blockly.Blocks['sql_min_having'] = {
      ...aggregateFunction_Min_Having_BlockDefinition(Blockly),
      onchange: AGGREGATE_FUNCTION_ONCHANGE
    };
    Blockly.Blocks['sql_max_having'] = {
      ...aggregateFunction_Max_Having_BlockDefinition(Blockly),
      onchange: AGGREGATE_FUNCTION_ONCHANGE
    };

    // DML: GROUP BY
    Blockly.Blocks['sql_group_by'] = {
      init: function () { this.jsonInit(GROUPBY_DEFINITION); },
      onchange: GROUPBY_ONCHANGE
    };

    Blockly.Blocks['sql_groupby_column'] = {
      init: function () { this.jsonInit(GROUPBY_COLUMN_DEFINITION); },
      onchange: GROUPBY_COLUMN_ONCHANGE
    };

    //DML: ORDER BY
    Blockly.Blocks['sql_order_by'] = {
      init: function () { this.jsonInit(ORDER_BY_DEFINITION); }

    };

    // REGISTRO DE GENERADORES DDL
    javascriptGenerator.forBlock['sql_create_table'] = function (block) {
      return CREATE_TABLE_GENERATOR(block, javascriptGenerator);
    };

    javascriptGenerator.forBlock['sql_column_primary_key'] = COLUMN_PRIMARY_KEY_GENERATOR;

    javascriptGenerator.forBlock['sql_column_definition'] = COLUMN_GENERATOR;
    javascriptGenerator.forBlock['sql_column_identity'] = COLUMN_IDENTITY_GENERATOR;
    javascriptGenerator.forBlock['sql_column_not_null'] = COLUMN_NOT_NULL_GENERATOR;
    javascriptGenerator.forBlock['sql_column_unique'] = COLUMN_UNIQUE_GENERATOR;
    javascriptGenerator.forBlock['sql_column_default'] = COLUMN_DEFAULT_GENERATOR;
    javascriptGenerator.forBlock['sql_column_check'] = COLUMN_CHECK_GENERATOR;
    javascriptGenerator.forBlock['sql_column_references'] = COLUMN_REFERENCES_GENERATOR;


    // === PASO 4: REGISTRO DE GENERADORES DML ===
    javascriptGenerator.forBlock['sql_select'] = function (block) {
      return SELECT_GENERATOR(block, javascriptGenerator);
    };

    javascriptGenerator.forBlock['sql_expression'] = function (block) {
      return EXPRESSION_GENERATOR(block, javascriptGenerator);
    };

    //¡ELIMINADO! Expresión dentro de los bloques de funciones de agregación
    // javascriptGenerator.forBlock['sql_aggregate_expression'] = function (block) {
    //   return AGGREGATE_EXPRESSION_GENERATOR(block, javascriptGenerator);
    // };

    //Registro de generadores de FROM (simple y con joins)
    javascriptGenerator.forBlock['sql_from_simple'] = function (block) {
      return FROM_SIMPLE_GENERATOR(block, javascriptGenerator);
    };

    javascriptGenerator.forBlock['sql_from'] = function (block) {
      return FROM_GENERATOR(block, javascriptGenerator);
    };

    //Registro de generadores de WHERE
    javascriptGenerator.forBlock['sql_where'] = function (block) {
      return WHERE_GENERATOR(block, javascriptGenerator);
    };

    javascriptGenerator.forBlock['sql_join'] = function (block) {
      return JOIN_GENERATOR(block, javascriptGenerator);
    };

    // javascriptGenerator.forBlock['sql_aggregate_expression'] = function (block) {
    //   return AGGREGATE_EXPRESSION_GENERATOR(block, javascriptGenerator);
    // };

    javascriptGenerator.forBlock['sql_distinct'] = function (block) {
      return DISTINCT_GENERATOR(block, javascriptGenerator);
    };

    javascriptGenerator.forBlock['sql_top'] = function (block) {
      return TOP_GENERATOR(block, javascriptGenerator);
    };

    javascriptGenerator.forBlock['sql_sum'] = function (block) {
      return SUM_GENERATOR(block, javascriptGenerator);
    };

    javascriptGenerator.forBlock['sql_avg'] = function (block) {
      return AVG_GENERATOR(block, javascriptGenerator);
    };

    javascriptGenerator.forBlock['sql_count'] = function (block) {
      return COUNT_GENERATOR(block, javascriptGenerator);
    };

    javascriptGenerator.forBlock['sql_min'] = function (block) {
      return MIN_GENERATOR(block, javascriptGenerator);
    };

    javascriptGenerator.forBlock['sql_max'] = function (block) {
      return MAX_GENERATOR(block, javascriptGenerator);
    };

    // Generadores para funciones de agregación en HAVING (sin coma dinámica y sin NEXT)
    // Generadores — agregar después de los 5 existentes
    javascriptGenerator.forBlock['sql_sum_having'] = (block) => SUM_HAVING_GENERATOR(block, javascriptGenerator);
    javascriptGenerator.forBlock['sql_avg_having'] = (block) => AVG_HAVING_GENERATOR(block, javascriptGenerator);
    javascriptGenerator.forBlock['sql_count_having'] = (block) => COUNT_HAVING_GENERATOR(block, javascriptGenerator);
    javascriptGenerator.forBlock['sql_min_having'] = (block) => MIN_HAVING_GENERATOR(block, javascriptGenerator);
    javascriptGenerator.forBlock['sql_max_having'] = (block) => MAX_HAVING_GENERATOR(block, javascriptGenerator);

    // === PASO 7: GENERADORES DML GROUP BY
    javascriptGenerator.forBlock['sql_group_by'] = function (block) {
      return GROUPBY_GENERATOR(block, javascriptGenerator);
    };

    javascriptGenerator.forBlock['sql_groupby_column'] = function (block) {
      return GROUPBY_COLUMN_GENERATOR(block, javascriptGenerator);
    };


    javascriptGenerator.forBlock['sql_having'] = function (block) {
      return HAVING_GENERATOR(block, javascriptGenerator);
    };

    javascriptGenerator.forBlock['sql_expression_single'] = function (block) {
      return EXPRESSION_SINGLE_GENERATOR(block, javascriptGenerator);
    };

    javascriptGenerator.forBlock['sql_comparison'] = function (block) {
      return COMPARISON_GENERATOR(block, javascriptGenerator);
    };

    javascriptGenerator.forBlock['sql_quantified_comparison'] = function (block) {
      return QUANTIFIED_COMPARISON_GENERATOR(block, javascriptGenerator);
    };

    javascriptGenerator.forBlock['sql_membership'] = function (block) {
      return MEMBERSHIP_GENERATOR(block, javascriptGenerator);
    };

    //DML: ORDER BY
    javascriptGenerator.forBlock['sql_order_by'] = function (block) {
      return ORDER_BY_GENERATOR(block, javascriptGenerator);
    }; //El generador lo maneja el expressionBlockDefinition

    // === TEMA PERSONALIZADO PARA BLOCKLY ===
    const darkGlassTheme = Blockly.Theme.defineTheme('darkGlass', {
      'base': Blockly.Themes.Classic,
      'componentStyles': {
        'workspaceBackgroundColour': 'transparent',
        'toolboxBackgroundColour': 'rgba(30, 30, 30, 0.7)',
        'toolboxForegroundColour': '#ffffff',
        'flyoutBackgroundColour': 'rgba(40, 40, 40, 0.8)',
        'flyoutForegroundColour': '#ffffff',
        'scrollbarColour': 'rgba(255, 255, 255, 0.3)',
        'insertionMarkerColour': '#ffffff'
      }
    });

    // === Referencias del DOM ===
    const blocklyDiv = document.getElementById('blocklyDiv');
    const showMermaidBtn = document.getElementById('showMermaidBtn');
    const showOutputBtn = document.getElementById('showOutputBtn');
    const showOpenBdBtn = document.getElementById('showOpenBdBtn');
    const showExportBdBtn = document.getElementById('showExportBdBtn');
    const mermaidDiv = document.getElementById('mermaidDiv');
    const sqlDiv = document.getElementById('sqlOutput');
    const openBdMenu = document.getElementById('openBdMenu');
    const exportBdMenu = document.getElementById('exportBdMenu');
    const executeBtn = document.getElementById('executeBtn');
    const exportSqlBtn = document.getElementById('exportSqlBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');

    // === Inicializar Blockly ===
    this.workspace = Blockly.inject(blocklyDiv, {
      toolbox: document.getElementById('toolbox'),
      theme: darkGlassTheme,
      renderer: 'geras',
      move: {
        scrollbars: true,
        drag: true,
        wheel: true
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2
      },
      trashcan: true
    });

    if (this.workspace.getFlyout()) {
      this.workspace.getFlyout().autoClose = false;

      setTimeout(() => {
        const toolbox = this.workspace.getToolbox();

        // === Click en categorías del toolbox → cambiar pestaña ERD ===
        const ddlCat = toolbox.getToolboxItems().find(item =>
          item.getName?.() === 'Crear tabla en base de datos'
        );
        const dmlCat = toolbox.getToolboxItems().find(item =>
          item.getName?.() === 'Consultar a Base de datos'
        );

        ddlCat?.getDiv?.()?.addEventListener('click', () => {
          const mermaidDiv = document.getElementById('mermaidDiv');
          if (mermaidDiv) mermaidDiv.style.display = 'block';
          this.switchErdTab('ddl');
          this.resizeBlockly();
        });

        dmlCat?.getDiv?.()?.addEventListener('click', () => {
          const mermaidDiv = document.getElementById('mermaidDiv');
          if (mermaidDiv) mermaidDiv.style.display = 'block';
          this.switchErdTab('dml');
          this.resizeBlockly();
        });

      }, 200);
    }

    // Fondo transparente en Blockly
    setTimeout(() => {
      const blocklyBackground = document.querySelector('.blocklyMainBackground');
      if (blocklyBackground) {
        blocklyBackground.setAttribute('fill', 'transparent');
      }

      const gridPattern = document.querySelector('.blocklyGridPattern');
      if (gridPattern) {
        gridPattern.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
      }
    }, 100);

    Blockly.svgResize(this.workspace);
    window.addEventListener('resize', () => Blockly.svgResize(this.workspace));

    // Ocasionalmente flexbox cambia el tamaño del div sin disparar 'resize' en window.
    // Un ResizeObserver asegura que las métricas de Blockly via svgResize siempre sean exactas.
    // Si Blockly cree que el div es pequeño, auto-scrolleará la pantalla al enfocar un text field.
    const resizeObserver = new ResizeObserver(() => {
      this.resizeBlockly();
    });
    resizeObserver.observe(blocklyDiv);

    // === LISTENER: actualizar SQL Output al cambiar workspace ===
    this.workspace.addChangeListener(() => {
      const code = javascriptGenerator.workspaceToCode(this.workspace);
      console.log('SQL generado:', code);

      clearTimeout(this._erdDebounceTimer);
      this._erdDebounceTimer = setTimeout(() => {
        this.updateDDLDiagram();

        // Highlight reactivo en tab DML
        if (this._activeErdTab === 'dml' && this._cytoscapeInstance) {
          const matches = [...code.matchAll(/\b(?:FROM|JOIN)\s+\[?([\w.]+)\]?/gi)];
          const tableNames = matches.map(m => m[1].split('.').pop());
          this.highlightTables(tableNames);
        }
      }, 400);

    });

    // === EVENTOS DE INTERFAZ ===
    showMermaidBtn?.addEventListener('click', () => {
      mermaidDiv.style.display =
        mermaidDiv.style.display === 'none' ? 'block' : 'none';
      this.resizeBlockly();
    });

    document.getElementById('erdTabDDL')?.addEventListener('click', () => {
      this.switchErdTab('ddl');
    });

    document.getElementById('erdTabDML')?.addEventListener('click', () => {
      this.switchErdTab('dml');
    });

    // === Controles de zoom del panel ERD (Cytoscape) ===
    document.getElementById('erdZoomIn')?.addEventListener('click', () => {
      if (!this._cytoscapeInstance) return;
      const cy = this._cytoscapeInstance;
      cy.zoom({ level: cy.zoom() * 1.25, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
    });

    document.getElementById('erdZoomOut')?.addEventListener('click', () => {
      if (!this._cytoscapeInstance) return;
      const cy = this._cytoscapeInstance;
      cy.zoom({ level: cy.zoom() / 1.25, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
    });

    document.getElementById('erdFit')?.addEventListener('click', () => {
      if (this._cytoscapeInstance) this._cytoscapeInstance.fit(40);
    });

    showOutputBtn?.addEventListener('click', () => {
      sqlDiv.style.display =
        sqlDiv.style.display === 'none' ? 'block' : 'none';
      this.resizeBlockly();
    });

    showOpenBdBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      openBdMenu?.classList.toggle('active');
      exportBdMenu?.classList.remove('active');
    });

    showExportBdBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      exportBdMenu?.classList.toggle('active');
      openBdMenu?.classList.remove('active');
    });

    document.addEventListener('click', () => {
      openBdMenu?.classList.remove('active');
      exportBdMenu?.classList.remove('active');
    });

    // ============================================================
    // BOTONES DE EXPORTACIÓN
    // ============================================================
    exportSqlBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const { sessionId } = apiService.getCurrentSession();
        if (!sessionId) {
          alert('No hay una sesión activa para exportar.');
          return;
        }

        const sqlText = await apiService.exportSessionSQL(sessionId);

        if (!sqlText || sqlText.trim().length === 0) {
          alert('Aún no has ejecutado ninguna consulta o el historial está vacío.');
          return;
        }

        const blob = new Blob([sqlText], { type: 'application/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `session_${sessionId}.sql`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error exportando SQL:', err);
        alert('Ocurrió un error al exportar SQL: ' + err.message);
      }
    });

    exportJsonBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        const state = Blockly.serialization.workspaces.save(this.workspace);
        const jsonText = JSON.stringify(state, null, 2);

        const blob = new Blob([jsonText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const { sessionId } = apiService.getCurrentSession();
        const suffix = sessionId ? `_${sessionId}` : '';

        const a = document.createElement('a');
        a.href = url;
        a.download = `workspace${suffix}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error exportando JSON:', err);
        alert('Ocurrió un error: ' + err.message);
      }
    });

    // ============================================================
    // BOTÓN EJECUTAR — conectado al backend
    // ============================================================
    executeBtn?.addEventListener('click', async () => {
      const sql = javascriptGenerator.workspaceToCode(this.workspace).trim();

      if (!sql) {
        sqlDiv.style.display = 'block';
        sqlDiv.innerHTML = `
          <h2>Resultado de Query SQL</h2>
          <pre style="color: #ffaa00;">⚠️ El workspace está vacío. Agrega bloques para generar SQL.</pre>
        `;
        return;
      }

      // Estado de carga
      executeBtn.disabled = true;
      executeBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Ejecutando...';
      sqlDiv.style.display = 'block';
      sqlDiv.innerHTML = `
        <h2>Resultado de Query SQL</h2>
        <pre style="color: #aaa;">⏳ Ejecutando consulta en el servidor...</pre>
      `;

      try {
        const result = await apiService.executeQuery(sql);
        this.showExecuteResult(result, sql);
      } catch (err) {
        this.showExecuteResult({ ok: false, error: err.message }, sql);
      } finally {
        executeBtn.disabled = false;
        executeBtn.innerHTML = '<i class="bi bi-play-fill me-1"></i>Ejecutar';
      }
    });

    console.log('Blockly inicializado con bloques SQL', this.workspace);
  },

  // ============================================================
  // MÉTODO: mostrar resultado del backend + actualizar Mermaid
  // ============================================================
  showExecuteResult: function (result, originalSQL = '') {
    const sqlDiv = document.getElementById('sqlOutput');
    sqlDiv.style.display = 'block';

    if (!result.ok) {
      sqlDiv.innerHTML = `
        <h2>Error al ejecutar</h2>
        <pre style="color: #ff5555;">❌ ${result.error}</pre>
        ${originalSQL ? `
          <details style="margin-top: 8px; cursor: pointer;">
            <summary style="color: rgba(255,255,255,0.4); font-size: 0.8rem;">SQL que se intentó ejecutar</summary>
            <pre style="color: #888; font-size: 0.8rem; margin-top: 5px;">${originalSQL}</pre>
          </details>
        ` : ''}
      `;
      return;
    }

    const { executionResult, transformedSQL } = result; // ast: eliminado — updateMermaidFromAST fue removido
    const rows = executionResult?.rows || [];
    const rowsAffected = executionResult?.rowsAffected?.[0] ?? null;

    // Construir tabla de resultados si hay filas
    let contentHTML = '';

    if (rows.length > 0) {
      const headers = Object.keys(rows[0]);
      contentHTML = `
        <div style="overflow-x: auto; margin-top: 10px;">
          <table style="
            width: 100%;
            border-collapse: collapse;
            font-size: 0.88rem;
            font-family: 'Fira Code', monospace;
          ">
            <thead>
              <tr>
                ${headers.map(h => `
                  <th style="
                    padding: 7px 14px;
                    background: rgba(122, 92, 255, 0.35);
                    border: 1px solid rgba(255,255,255,0.15);
                    color: #fff;
                    text-align: left;
                    white-space: nowrap;
                  ">${h}</th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map((row, i) => `
                <tr style="background: ${i % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.04)'};">
                  ${headers.map(h => `
                    <td style="
                      padding: 5px 14px;
                      border: 1px solid rgba(255,255,255,0.08);
                      color: #00ff99;
                    ">${row[h] ?? '<span style="color:#666">NULL</span>'}</td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (rowsAffected !== null && rowsAffected > 0) {
      contentHTML = `<pre style="color: #00ff99; margin-top: 10px;">✅ ${rowsAffected} fila(s) afectada(s)</pre>`;
    } else {
      contentHTML = `<pre style="color: #aaa; margin-top: 10px;">✅ Consulta ejecutada correctamente. Sin filas de resultado.</pre>`;
    }

    sqlDiv.innerHTML = `
      <h2>
        Resultado de Query SQL
        ${rows.length > 0
        ? `<span style="font-size: 0.78rem; font-weight: 400; color: #aaa; margin-left: 10px;">${rows.length} fila(s)</span>`
        : ''
      }
      </h2>
      <details style="margin-top: 1px; cursor: pointer;">
        <summary style="color: rgba(255,255,255,0.4); font-size: 0.8rem;">Ver SQL transformado enviado al servidor</summary>
        <pre style="color: #888; font-size: 0.8rem; margin-top: 6px;">${transformedSQL || originalSQL}</pre>
      </details>
      ${contentHTML}
    `;

    // updateMermaidFromAST: eliminado — el tab DML pasó a renderERD(chinookSchema) con Cytoscape
  },

  // ============================================================
  // MÉTODO: forzar recalculo de métricas de Blockly
  // ============================================================
  resizeBlockly: function () {
    if (this.workspace) {
      Blockly.svgResize(this.workspace);
    }
  },

  // ============================================================
  // MÉTODO: redimensionar Cytoscape cuando cambia el ancho del panel ERD
  // ============================================================
  resizeERD: function () {
    if (this._cytoscapeInstance) {
      this._cytoscapeInstance.resize();
      this._cytoscapeInstance.emit('viewport');
    }
  },

  // updateMermaidFromAST: eliminado — el tab DML pasó a renderERD(chinookSchema) con Cytoscape.
  //   Para importación dinámica de BDs en el futuro, conectar el schema parseado a renderERD() directamente.
  // buildMermaidFromAST: eliminado — era el helper de updateMermaidFromAST.

  // ============================================================
  // MÉTODO: actualizar el diagrama DDL desde el workspace
  // Antes: updateMermaidFromWorkspace — renombrado porque ya no
  //        usa Mermaid; renderiza HTML cards directamente.
  // ============================================================
  updateDDLDiagram: async function () {
    const mermaidDiv = document.getElementById('mermaidDiv');
    if (!mermaidDiv || mermaidDiv.style.display === 'none') return;

    const panel = document.getElementById('erdPanelDDL');
    if (!panel) return;

    const tables = this.extractTablesFromWorkspace();

    if (tables.length === 0) {
      panel.innerHTML = `
        <p style="color: rgba(255,255,255,0.4); font-size: 0.9rem; margin-top: 12px;">
          Agrega un bloque CREATE TABLE para ver el diagrama.
        </p>
      `;
      return;
    }

    panel.innerHTML = `
      <div id="erdDiagram" style="
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        padding: 16px;
        align-items: flex-start;
      ">
        ${tables.map(t => this.renderTableCard(t)).join('')}
      </div>
    `;
  },

  // ============================================================
  // MÉTODO: cambiar pestaña activa del panel ERD
  // ============================================================
  switchErdTab: function (tab) {
    this._activeErdTab = tab;

    const btnDDL = document.getElementById('erdTabDDL');
    const btnDML = document.getElementById('erdTabDML');
    const panelDDL = document.getElementById('erdPanelDDL');
    const panelDML = document.getElementById('erdPanelDML');
    if (!btnDDL || !btnDML || !panelDDL || !panelDML) return;

    const activeStyle = {
      background: 'rgba(25,90,60,0.18)',
      borderBottom: '2px solid rgba(50,160,100,0.7)',
      color: 'rgba(100,200,145,0.95)',
      fontWeight: '500'
    };
    const inactiveStyle = {
      background: 'transparent',
      borderBottom: '2px solid transparent',
      color: 'rgba(255,255,255,0.3)',
      fontWeight: '400'
    };

    const zoomControls = document.getElementById('erdZoomControls');

    if (tab === 'ddl') {
      Object.assign(btnDDL.style, activeStyle);
      Object.assign(btnDML.style, inactiveStyle);
      panelDDL.style.display = 'block';
      panelDML.style.display = 'none';
      if (zoomControls) zoomControls.style.display = 'none';
      this.updateDDLDiagram();
    } else {
      Object.assign(btnDML.style, activeStyle);
      Object.assign(btnDDL.style, inactiveStyle);
      panelDML.style.display = 'block';
      panelDDL.style.display = 'none';
      if (zoomControls) zoomControls.style.display = 'flex';
      this.renderERD(chinookSchema);
    }
  },

  // ============================================================
  // MÉTODO: renderizar el ERD con Cytoscape.js
  // Antes: renderChinookERD() — renombrado a renderERD(schema)
  //        para aceptar cualquier schema { tables, fkEdges },
  //        no solo el de Chinook. El schema de Chinook viene de
  //        chinookSchema.js; futuros schemas de BDs importadas
  //        seguirán el mismo formato y se pasarán aquí directamente.
  // ── Overlay HTML manual (sin plugins externos) ──────────────
  // ============================================================
  renderERD: function (schema) {
    const panel = document.getElementById('erdPanelDML');
    if (!panel) return;

    if (panel.dataset.rendered === 'true' && this._cytoscapeInstance) return;

    if (typeof cytoscape === 'undefined') {
      panel.innerHTML = `<p style="color:#ff5555; font-size:0.85rem; padding:12px;">Error: Cytoscape no está disponible.</p>`;
      return;
    }

    // Contenedor: canvas Cytoscape + overlay HTML superpuesto
    panel.innerHTML = `
      <div id="cyWrapper" style="position:relative; width:100%; height:520px; border-radius:8px; overflow:hidden; background:rgba(10,10,22,0.6);">
        <div id="cyCanvas"  style="width:100%; height:100%;"></div>
        <div id="cyOverlay" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; overflow:hidden;"></div>
      </div>
    `;

    // ── Constantes de dimensión ───────────────────────────────
    const NODE_W = 200;
    const HDR_H = 32;
    const ROW_H = 22;

    // ── Datos del schema (tablas y relaciones FK) ─────────────
    const { tables, fkEdges } = schema;

    // ── Función para construir HTML de una tarjeta ────────────
    const buildCardHTML = (tableId, cols) => {
      const rows = cols.map(col => {
        const icon = col.pk ? '🔑' : col.fk ? '🔗' : '○';
        const color = col.pk ? '#f5c542' : col.fk ? '#4fc3f7' : 'rgba(255,255,255,0.82)';
        return `<div style="
          height:${ROW_H}px; box-sizing:border-box; padding:0 8px;
          border-top:1px solid rgba(255,255,255,0.06);
          display:flex; align-items:center; gap:5px;
          font-family:'Fira Code',monospace; font-size:11px;
        ">
          <span style="font-size:10px;">${icon}</span>
          <span style="color:${color}; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${col.name}</span>
          <span style="color:rgba(255,255,255,0.27); font-size:10px; white-space:nowrap;">${col.type}</span>
        </div>`;
      }).join('');

      return `
        <div class="cy-card-header" style="
          height:${HDR_H}px; box-sizing:border-box;
          background:rgba(80,60,180,0.85);
          display:flex; align-items:center; padding:0 10px;
          color:#fff; font-weight:600; font-size:13px;
          font-family:'Fira Code',monospace; letter-spacing:0.02em;
        ">${tableId}</div>
        ${rows}
      `;
    };

    // ── Elementos para Cytoscape (solo layout + aristas) ──────
    const elements = [
      ...tables.map(t => ({
        data: {
          id: t.id,
          width: NODE_W,
          height: HDR_H + t.cols.length * ROW_H,
        }
      })),
      ...fkEdges.map((e, i) => ({
        data: { id: `e${i}`, source: e.source, target: e.target, label: e.label }
      }))
    ];

    // ── Instancia Cytoscape ───────────────────────────────────
    const cy = cytoscape({
      container: document.getElementById('cyCanvas'),
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-opacity': 0,
            'border-opacity': 0,
            'width': 'data(width)',
            'height': 'data(height)',
            'label': '',
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': 'rgba(120,100,255,0.45)',
            'target-arrow-color': 'rgba(140,120,255,0.65)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '9px',
            'color': 'rgba(200,200,255,0.5)',
            'text-background-color': 'rgba(10,10,28,0.92)',
            'text-background-opacity': 1,
            'text-background-padding': '2px',
            'font-family': 'Fira Code, monospace',
          }
        },
        {
          selector: 'edge:loop',
          style: {
            'curve-style': 'bezier',
            'loop-direction': '-45deg',
            'loop-sweep': '40deg',
            'control-point-distance': 80,
          }
        }
      ],
      layout: { //Layout preset para las tablas de Chinook DB
        name: 'preset',
        animate: false,
        fit: true,
        padding: 40,
        // Posiciones manuales para replicar el layout de la imagen de referencia de Chinook.
        // Coordenadas = centro del nodo. Con fit:true Cytoscape hace zoom para encajarlo todo.
        positions: {
          Artist: { x: 120, y: 40 },
          Album: { x: 370, y: 50 },
          Track: { x: 630, y: 120 },
          MediaType: { x: 900, y: 40 },
          Genre: { x: 900, y: 220 },
          Playlist: { x: 120, y: 320 },
          PlaylistTrack: { x: 370, y: 320 },
          Employee: { x: 120, y: 580 },
          Customer: { x: 390, y: 560 },
          InvoiceLine: { x: 660, y: 430 },
          Invoice: { x: 900, y: 510 },
        },
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      minZoom: 0.08,
      maxZoom: 4,
      wheelSensitivity: 0.2,
    });

    // ── Overlay HTML: tarjetas de tabla ───────────────────────
    const overlay = document.getElementById('cyOverlay');
    const cardEls = {};

    tables.forEach(t => {
      const nodeH = HDR_H + t.cols.length * ROW_H;
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        position:absolute; transform-origin:top left; pointer-events:none;
        width:${NODE_W}px;
        background:rgba(14,14,32,0.97);
        border:1.5px solid rgba(120,100,255,0.55); border-radius:8px;
        overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.6);
      `;
      wrapper.innerHTML = buildCardHTML(t.id, t.cols);
      overlay.appendChild(wrapper);
      cardEls[t.id] = wrapper;
    });

    // Actualiza posición y escala de cada tarjeta según el viewport
    const updatePositions = () => {
      const zoom = cy.zoom();
      cy.nodes().forEach(node => {
        const el = cardEls[node.id()];
        if (!el) return;
        const pos = node.renderedPosition();
        const w = node.data('width') * zoom;
        const h = node.data('height') * zoom;
        el.style.left = `${pos.x - w / 2}px`;
        el.style.top = `${pos.y - h / 2}px`;
        el.style.transform = `scale(${zoom})`;
      });
    };

    cy.on('viewport layoutstop', updatePositions);
    cy.on('drag', 'node', updatePositions);
    // Al primer layoutstop: forzar resize + fit para que Cytoscape re-mida el contenedor
    // con sus dimensiones reales (en el momento de construcción puede estar en 0×0).
    cy.one('layoutstop', () => {
      cy.resize();
      cy.fit(40);
      updatePositions();
    });

    this._cytoscapeInstance = cy;
    this._cardEls = cardEls;
    panel.dataset.rendered = 'true';
  },

  // ============================================================
  // MÉTODO: resaltar tablas activas en el ERD de Cytoscape
  // ── Actualiza estilos del overlay HTML directamente ─────────
  // ============================================================
  highlightTables: function (tableNames) {
    if (!this._cardEls) return;
    const hasFocus = Array.isArray(tableNames) && tableNames.length > 0;

    Object.entries(this._cardEls).forEach(([id, wrapper]) => {
      const isActive = hasFocus && tableNames.some(n => n.toLowerCase() === id.toLowerCase());
      const isDimmed = hasFocus && !isActive;

      wrapper.style.borderColor = isActive ? 'rgba(0,255,150,0.9)'
        : isDimmed ? 'rgba(70,70,90,0.35)'
          : 'rgba(120,100,255,0.55)';
      wrapper.style.boxShadow = isActive ? '0 0 18px rgba(0,255,150,0.4)'
        : '0 4px 20px rgba(0,0,0,0.6)';
      wrapper.style.opacity = isDimmed ? '0.3' : '1';

      const header = wrapper.querySelector('.cy-card-header');
      if (header) {
        header.style.background = isActive ? 'rgba(0,170,95,0.9)'
          : isDimmed ? 'rgba(45,45,65,0.6)'
            : 'rgba(80,60,180,0.85)';
      }
    });
  },

  extractTablesFromWorkspace: function () {
    const allBlocks = this.workspace.getAllBlocks(false);
    const createTableBlocks = allBlocks.filter(b => b.type === 'sql_create_table');
    const tables = [];

    function mapType(t) {
      const u = (t || '').toUpperCase();
      if (u === 'INTEGER') return 'INT';
      if (u === 'FLOAT') return 'FLOAT';
      if (u === 'BOOL') return 'BOOL';
      if (u === 'DATE') return 'DATE';
      if (u === 'DATETIME') return 'DATETIME';
      return u; // VARCHAR, CHAR, etc.
    }

    for (const tableBlock of createTableBlocks) {
      const tableName = tableBlock.getFieldValue('TABLE_NAME') || 'tabla';
      const columns = [];

      let colBlock = tableBlock.getInputTargetBlock('COLUMNS');
      while (colBlock) {
        const isPK = colBlock.type === 'sql_column_primary_key';
        const isCol = colBlock.type === 'sql_column_definition';

        if (isCol || isPK) {
          const colName = colBlock.getFieldValue('COLUMN_NAME') || 'col';
          const dataType = mapType(colBlock.getFieldValue('DATA_TYPE'));

          const col = {
            name: colName,
            type: dataType,
            pk: isPK,
            notNull: isPK,
            unique: false,
            fk: null,
            default: null,
            check: null,
          };

          // Leer constraints encadenados lateralmente
          if (isCol) {
            let constraint = colBlock.getInputTargetBlock('FIRST_CONSTRAINT');
            while (constraint) {
              switch (constraint.type) {
                case 'sql_column_not_null':
                  col.notNull = true;
                  break;
                case 'sql_column_unique':
                  col.unique = true;
                  break;
                case 'sql_column_default':
                  col.default = constraint.getFieldValue('DEFAULT_VALUE');
                  break;
                case 'sql_column_check':
                  col.check = constraint.getFieldValue('CHECK_CONDITION');
                  break;
                case 'sql_column_references':
                  col.fk = {
                    table: constraint.getFieldValue('REF_TABLE'),
                    column: constraint.getFieldValue('REF_COLUMN'),
                  };
                  break;
              }
              constraint = constraint.getInputTargetBlock('NEXT_CONSTRAINT');
            }
          }

          columns.push(col);
        }

        colBlock = colBlock.getNextBlock();
      }

      tables.push({ name: tableName, columns });
    }

    return tables;
  },

  renderTableCard: function (table) {
    const headerBg = 'rgba(80, 60, 180, 0.85)';
    const cardBg = 'rgba(30, 30, 50, 0.95)';
    const borderColor = 'rgba(120, 100, 255, 0.5)';
    const dividerColor = 'rgba(255,255,255,0.08)';

    const colRows = table.columns.map(col => {
      // Icono de tipo
      let icon = '○';
      let iconColor = 'rgba(255,255,255,0.35)';
      if (col.pk) { icon = '🔑'; iconColor = '#f5c542'; }
      else if (col.fk) { icon = '🔗'; iconColor = '#4fc3f7'; }
      else if (col.unique) { icon = '◆'; iconColor = '#ce93d8'; }

      // Badges de constraints
      const badges = [];
      if (col.notNull && !col.pk) badges.push(`<span style="
      font-size: 0.62rem;
      background: rgba(255,100,100,0.2);
      color: #ff8a80;
      border-radius: 3px;
      padding: 1px 4px;
      margin-left: 4px;
    ">NN</span>`);
      if (col.unique) badges.push(`<span style="
      font-size: 0.62rem;
      background: rgba(180,100,255,0.2);
      color: #ce93d8;
      border-radius: 3px;
      padding: 1px 4px;
      margin-left: 4px;
    ">UQ</span>`);
      if (col.default !== null) badges.push(`<span style="
      font-size: 0.62rem;
      background: rgba(100,200,100,0.2);
      color: #a5d6a7;
      border-radius: 3px;
      padding: 1px 4px;
      margin-left: 4px;
    ">DEF</span>`);
      if (col.check) badges.push(`<span style="
      font-size: 0.62rem;
      background: rgba(255,200,50,0.2);
      color: #fff176;
      border-radius: 3px;
      padding: 1px 4px;
      margin-left: 4px;
    ">CHK</span>`);
      if (col.fk) badges.push(`<span style="
      font-size: 0.62rem;
      background: rgba(70,180,255,0.2);
      color: #4fc3f7;
      border-radius: 3px;
      padding: 1px 4px;
      margin-left: 4px;
    ">FK→${col.fk.table}</span>`);

      return `
      <tr style="border-top: 1px solid ${dividerColor};">
        <td style="padding: 5px 10px; width: 22px; text-align: center;">
          <span style="color: ${iconColor}; font-size: 0.85rem;">${icon}</span>
        </td>
        <td style="
          padding: 5px 6px;
          color: ${col.pk ? '#f5c542' : 'rgba(255,255,255,0.85)'};
          font-family: 'Fira Code', monospace;
          font-size: 0.82rem;
          white-space: nowrap;
        ">
          ${col.name}
          ${badges.join('')}
        </td>
        <td style="
          padding: 5px 10px;
          color: rgba(255,255,255,0.4);
          font-family: 'Fira Code', monospace;
          font-size: 0.78rem;
          white-space: nowrap;
          text-align: right;
        ">${col.type}</td>
      </tr>
    `;
    }).join('');

    const emptyRow = `
    <tr>
      <td colspan="3" style="
        padding: 10px;
        color: rgba(255,255,255,0.25);
        font-size: 0.8rem;
        text-align: center;
        font-style: italic;
      ">Sin columnas</td>
    </tr>
  `;

    return `
    <div style="
      border: 1px solid ${borderColor};
      border-radius: 8px;
      overflow: hidden;
      min-width: 220px;
      max-width: 380px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      background: ${cardBg};
      flex-shrink: 0;
    ">
      <!-- Header -->
      <div style="
        background: ${headerBg};
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 1px solid ${borderColor};
      ">
        <span style="font-size: 1rem;">📋</span>
        <span style="
          color: #fff;
          font-weight: 600;
          font-family: 'Fira Code', monospace;
          font-size: 0.9rem;
          letter-spacing: 0.03em;
        ">${table.name}</span>
      </div>
      <!-- Columnas -->
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
          ${table.columns.length > 0 ? colRows : emptyRow}
        </tbody>
      </table>
    </div>
  `;
  },

  // buildMermaidFromWorkspace: eliminado — generaba string Mermaid desde bloques DDL,
  //   reemplazado por updateDDLDiagram() que renderiza HTML cards directamente.

  resizeBlockly: function () {
    if (this.workspace) {
      Blockly.svgResize(this.workspace);
    }
  },

  showSQLExample: function () {
    const sqlDiv = document.getElementById('sqlOutput');
    sqlDiv.innerHTML = `
      <h2>Resultado de Query SQL</h2>
      <pre>
-- 💡 Tip: Usa el botón "Ejecutar" para enviar la query al servidor
      </pre>
    `;
  }
};
