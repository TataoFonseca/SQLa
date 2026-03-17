// src/js/controllers/appController.js

import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import mermaid from 'mermaid';

// ===Importe de Bloques===
// BLOQUES DDL
import { CREATE_TABLE_DEFINITION, CREATE_TABLE_GENERATOR } from '../blocks/ddl_CreateTableBlock.js';
import { columnDefinitionBlockInit, COLUMN_GENERATOR } from '../blocks/ddl_ColumnDefinitionBlock.js';

// Menu contextual para constraints de columna
import { COLUMN_DEFINITION_CONTEXT_MENU } from '../blocks/extensions/columnDefinitionContextMenu.js';

// CONSTRAINTS DE COLUMNA

// import {
//   COLUMN_IDENTITY_DEFINITION,   COLUMN_IDENTITY_GENERATOR,   COLUMN_IDENTITY_ONCHANGE,
//   COLUMN_NOT_NULL_DEFINITION,   COLUMN_NOT_NULL_GENERATOR,   COLUMN_NOT_NULL_ONCHANGE,
//   COLUMN_UNIQUE_DEFINITION,     COLUMN_UNIQUE_GENERATOR,     COLUMN_UNIQUE_ONCHANGE,
//   COLUMN_DEFAULT_DEFINITION,    COLUMN_DEFAULT_GENERATOR,    COLUMN_DEFAULT_ONCHANGE,
//   COLUMN_CHECK_DEFINITION,      COLUMN_CHECK_GENERATOR,      COLUMN_CHECK_ONCHANGE,
//   COLUMN_REFERENCES_DEFINITION, COLUMN_REFERENCES_GENERATOR, COLUMN_REFERENCES_ONCHANGE,
// } from '../blocks/ddl_ColumnConstraints.js';

import {
  columnIdentityBlockInit,    COLUMN_IDENTITY_GENERATOR,
  columnNotNullBlockInit,     COLUMN_NOT_NULL_GENERATOR,
  columnUniqueBlockInit,      COLUMN_UNIQUE_GENERATOR,
  columnDefaultBlockInit,     COLUMN_DEFAULT_GENERATOR,
  columnCheckBlockInit,       COLUMN_CHECK_GENERATOR,
  columnReferencesBlockInit,  COLUMN_REFERENCES_GENERATOR,
} from '../blocks/ddl_ColumnConstraints.js';


// BLOQUES DML
import { FROM_SIMPLE_DEFINITION, FROM_SIMPLE_GENERATOR } from '../blocks/dml_FromSimpleBlock.js'; // (Agregado) FROM simple sin soporte de JOINs (FromSimpleBlock.js)
import { FROM_DEFINITION, FROM_GENERATOR } from '../blocks/dml_FromBlock.js'; // FROM con soporte de JOINs (FromBlock.js)
import { SELECT_DEFINITION, SELECT_GENERATOR, } from '../blocks/dml_SelectBlock.js';

// BLOQUE DE MENÚ CONTEXTUAL PARA FROM (FromSimpleBlock.js y FromBlock.js)
import { registerFromContextMenu, registerFromJoinsContextMenu } from '../blocks/extensions/fromContextMenu.js';

//BLOQUES DML JOIN
import { JOIN_DEFINITION, JOIN_GENERATOR, JOIN_ONCHANGE } from '../blocks/dml_JoinBlock.js';

// BLOQUE DE EXPRESSION CON MENÚ CONTEXTUAL para BLOQUES DISTINCT Y TOP
import {
  expressionBlockDefinition, // cambió de EXPRESSION_DEFINITION, a  expressionBlockDefinition, para usar el patrón init y así poder agregar el input NEXT necesario para la coma dinámica, pero el generador y el onchange se mantienen igual
  EXPRESSION_GENERATOR,
  EXPRESSION_ONCHANGE // Onchange para manejar la coma dinámica en el bloque de expresión
} from '../blocks/dml_ExpressionBlock.js';

// BLOQUES DML: DISTINCT Y TOP
import { DISTINCT_DEFINITION, DISTINCT_GENERATOR } from '../blocks/dml_DistinctBlock.js';
import { TOP_DEFINITION, TOP_GENERATOR } from '../blocks/dml_TopBlock.js';

// EXTENSIÓN DEL MENÚ CONTEXTUAL para DISTINCT/TOP en EXPRESSION
import { registerExpressionContextMenu } from '../blocks/extensions/expressionContextMenu.js';


// BLOQUE DE EXPRESSION dentro de funciones de agregación (sin NEXT, sin onchange) - ¡ELIMINADO!
// import { AGGREGATE_EXPRESSION_DEFINITION, AGGREGATE_EXPRESSION_GENERATOR, } from '../blocks/dml_aggregateFunctionsExpressionBlock.js';

// BLOQUES DE FUNCIONES DE AGREGACIÓN
import {
  // SUM_DEFINITION,
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
  // AGGREGATE_FUNCTION_ONCHANGE // Onchange compartido para todos los bloques de funciones de agregación para añadir soporte de coma dinámica
  createAggregateFunctionOnChange
} from '../blocks/dml_aggregateFunctionsBlock.js';

// EXTENSIÓN DE MENÚ CONTEXTUAL PARA FUNCIONES DE AGREGACIÓN - CAMBIÓ DE registerAggregateFunctionExpressionContextMenu a registerAggregateFunctionContextMenu
import { registerAggregateFunctionContextMenu } from '../blocks/extensions/aggregateFunctionContextMenu.js';

// BLOQUES DML: GROUP BY y su Bloque Columna GROUPBY COLUMN
import { GROUPBY_DEFINITION, GROUPBY_GENERATOR, GROUPBY_ONCHANGE } from '../blocks/dml_GroupByBlock.js';
import { GROUPBY_COLUMN_DEFINITION, GROUPBY_COLUMN_GENERATOR, GROUPBY_COLUMN_ONCHANGE } from '../blocks/dml_GroupByColumnBlock.js';

// ESPACIO PARA BLOQUE HAVING
import { HAVING_DEFINITION, HAVING_GENERATOR } from '../blocks/dml_HavingBlock.js';

// EXTENSIÓN PARA MENU CONTEXTUAL DE EXPRESIONES EN HAVING
import { registerHavingExpressionContextMenu } from '../blocks/extensions/havingExpressionContextMenu.js';

// BLOQUES DML: EXPRESSION SINGLE — versión sin NEXT para lado derecho de comparaciones
import { EXPRESSION_SINGLE_DEFINITION, EXPRESSION_SINGLE_GENERATOR } from '../blocks/dml_ExpressionSingleBlock.js';

// BLOQUES DML: COMPARACIONES (output Condition — para WHERE/HAVING)
import { COMPARISON_DEFINITION, COMPARISON_GENERATOR } from '../blocks/dml_ComparisonBlock.js';
import { QUANTIFIED_COMPARISON_DEFINITION, QUANTIFIED_COMPARISON_GENERATOR } from '../blocks/dml_QuantifiedComparisonBlock.js';
import { MEMBERSHIP_DEFINITION, MEMBERSHIP_GENERATOR } from '../blocks/dml_MembershipBlock.js';




mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose"
});

export const AppController = {
  workspace: null,

  init: function () {

    // === DEFINIR ORDEN DE OPERACIONES PARA EL GENERADOR ===
    javascriptGenerator.ORDER_ATOMIC = 0;
    javascriptGenerator.ORDER_FUNCTION_CALL = 1;
    javascriptGenerator.ORDER_MEMBER = 2;
    javascriptGenerator.ORDER_MULTIPLICATION = 3;
    javascriptGenerator.ORDER_DIVISION = 3;
    javascriptGenerator.ORDER_ADDITION = 4;
    javascriptGenerator.ORDER_SUBTRACTION = 4;
    javascriptGenerator.ORDER_NONE = 99;

    //REGISTRO DEL MENÚ CONTEXTUAL PARA EL BLOQUE DE EXPRESIÓN (ANTES DE LOS BLOQUES)
    registerExpressionContextMenu();

    //REGISTRO DEL MENÚ CONTEXTUAL PARA FROM (FromSimpleBlock y FromBlock)
    registerFromContextMenu();
    registerFromJoinsContextMenu();

    //REGISTRO DEL MENÚ CONTEXTUAL DE EXTENSIÓN PARA *--*EXPRESIONES EN*--* FUNCIONES DE AGREGACIÓN
    registerAggregateFunctionContextMenu();

    //REGISTRO DEL MENÚ CONTEXTUAL DE EXTENSIÓN PARA EXPRESIONES EN HAVING
    registerHavingExpressionContextMenu();

    // Registrar extensión ANTES de defineBlocksWithJsonArray
    Blockly.Extensions.registerMixin(
      'column_definition_context_menu',
      COLUMN_DEFINITION_CONTEXT_MENU.mixin
    );


    // PASO 2: REGISTRO DE BLOQUES (JSON) ===
    //Bloques sin OnChange, se usa defineBlocksWithJsonArray
    Blockly.defineBlocksWithJsonArray([
      // DDL
      CREATE_TABLE_DEFINITION,
      // COLUMN_DEFINITION,

      // Constraints de columna
      // COLUMN_IDENTITY_DEFINITION,
      // COLUMN_NOT_NULL_DEFINITION,
      // COLUMN_UNIQUE_DEFINITION,
      // COLUMN_DEFAULT_DEFINITION,
      // COLUMN_CHECK_DEFINITION,
      // COLUMN_REFERENCES_DEFINITION,

      // DML
      FROM_SIMPLE_DEFINITION, //Agregado FROM simple sin soporte de JOINs
      FROM_DEFINITION,
      SELECT_DEFINITION,

      // DML: DISTINCT Y TOP
      DISTINCT_DEFINITION, // Ahora es flag global, sin EXPRESSION input
      TOP_DEFINITION, // Ahora es flag global, sin EXPRESSION input

      //DML: HAVING
      HAVING_DEFINITION,

      //DML: EXPRESSION SINGLE (sin onchange, sin NEXT) que se auto-inserta en LEFT y RIGHT en los bloques de comparación
      EXPRESSION_SINGLE_DEFINITION,

      // DML: COMPARACION, QUANTIFIED COMPARISON Y MEMBERSHIP
      COMPARISON_DEFINITION,
      QUANTIFIED_COMPARISON_DEFINITION,
      MEMBERSHIP_DEFINITION,

    ]);

    //============== Bloques con onchange 
    Blockly.Blocks['sql_column_definition'] = {
      ...columnDefinitionBlockInit(Blockly)
    };

    Blockly.Blocks['sql_column_identity']   = columnIdentityBlockInit(Blockly);
    Blockly.Blocks['sql_column_not_null']   = columnNotNullBlockInit(Blockly);
    Blockly.Blocks['sql_column_unique']     = columnUniqueBlockInit(Blockly);
    Blockly.Blocks['sql_column_default']    = columnDefaultBlockInit(Blockly);
    Blockly.Blocks['sql_column_check']      = columnCheckBlockInit(Blockly);
    Blockly.Blocks['sql_column_references'] = columnReferencesBlockInit(Blockly);


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

    //DML: JOIN (con onchange)
    Blockly.Blocks['sql_join'] = {
      init: function () { this.jsonInit(JOIN_DEFINITION); },
      onchange: JOIN_ONCHANGE
    };

    const AGGREGATE_FUNCTION_ONCHANGE = createAggregateFunctionOnChange(Blockly);
    
    //DML: FUNCIONES DE AGREGACIÓN (con onchange)
    Blockly.Blocks['sql_sum'] = {
      // init: function () { this.jsonInit(SUM_DEFINITION); },
      ...aggregateFunction_Sum_BlockDefinition(Blockly),
      onchange: AGGREGATE_FUNCTION_ONCHANGE
    };

    Blockly.Blocks['sql_avg'] = {
      // init: function () { this.jsonInit(AVG_DEFINITION); },
      ...aggregateFunction_Avg_BlockDefinition(Blockly),
      onchange: AGGREGATE_FUNCTION_ONCHANGE
    };

    Blockly.Blocks['sql_count'] = {
      // init: function () { this.jsonInit(COUNT_DEFINITION); },
      ...aggregateFunction_Count_BlockDefinition(Blockly),
      onchange: AGGREGATE_FUNCTION_ONCHANGE
    };

    Blockly.Blocks['sql_min'] = {
      // init: function () { this.jsonInit(MIN_DEFINITION); },
      ...aggregateFunction_Min_BlockDefinition(Blockly),
      onchange: AGGREGATE_FUNCTION_ONCHANGE
    };

    Blockly.Blocks['sql_max'] = {
      // init: function () { this.jsonInit(MAX_DEFINITION); },
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


    // === PASO 3: REGISTRO DE GENERADORES DDL ===
    javascriptGenerator.forBlock['sql_create_table'] = function (block) {
      return CREATE_TABLE_GENERATOR(block, javascriptGenerator);
    };

    // javascriptGenerator.forBlock['sql_column_definition'] = function (block) {
    //   return COLUMN_GENERATOR(block, javascriptGenerator);
    // };

    javascriptGenerator.forBlock['sql_column_definition'] = COLUMN_GENERATOR;

    // Generadores para constraints de columna
    // javascriptGenerator.forBlock['sql_column_identity']    = COLUMN_IDENTITY_GENERATOR;
    // javascriptGenerator.forBlock['sql_column_not_null']    = COLUMN_NOT_NULL_GENERATOR;
    // javascriptGenerator.forBlock['sql_column_unique']      = COLUMN_UNIQUE_GENERATOR;
    // javascriptGenerator.forBlock['sql_column_default']     = COLUMN_DEFAULT_GENERATOR;
    // javascriptGenerator.forBlock['sql_column_check']       = COLUMN_CHECK_GENERATOR;
    // javascriptGenerator.forBlock['sql_column_references']  = COLUMN_REFERENCES_GENERATOR;

    javascriptGenerator.forBlock['sql_column_definition'] = COLUMN_GENERATOR;
    javascriptGenerator.forBlock['sql_column_identity']   = COLUMN_IDENTITY_GENERATOR;
    javascriptGenerator.forBlock['sql_column_not_null']   = COLUMN_NOT_NULL_GENERATOR;
    javascriptGenerator.forBlock['sql_column_unique']     = COLUMN_UNIQUE_GENERATOR;
    javascriptGenerator.forBlock['sql_column_default']    = COLUMN_DEFAULT_GENERATOR;
    javascriptGenerator.forBlock['sql_column_check']      = COLUMN_CHECK_GENERATOR;
    javascriptGenerator.forBlock['sql_column_references'] = COLUMN_REFERENCES_GENERATOR;


    // === PASO 4: REGISTRO DE GENERADORES DML ===
    javascriptGenerator.forBlock['sql_select'] = function (block) {
      return SELECT_GENERATOR(block, javascriptGenerator);
    };

    javascriptGenerator.forBlock['sql_expression'] = function (block) {
      return EXPRESSION_GENERATOR(block, javascriptGenerator);
    };

    //¡ELIMINADO! Expresión dentro de los bloques de función de agregación
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

    javascriptGenerator.forBlock['sql_join'] = function (block) {
      return JOIN_GENERATOR(block, javascriptGenerator);
    };


    // === PASO 5: GENERADORES DML: DISTINCT Y TOP
    javascriptGenerator.forBlock['sql_distinct'] = function (block) {
      return DISTINCT_GENERATOR(block, javascriptGenerator);
    };

    javascriptGenerator.forBlock['sql_top'] = function (block) {
      return TOP_GENERATOR(block, javascriptGenerator);
    };

    // === PASO 6: GENERADORES DML FUNCIONES DE AGREGACIÓN
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

    // PASO 8: GENERADORES DML HAVING
    javascriptGenerator.forBlock['sql_having'] = function (block) {
      return HAVING_GENERATOR(block, javascriptGenerator);
    };

    //Generador para el bloque de expresión simple (sin NEXT) que se auto-inserta en HAVING y en el lado derecho de las comparaciones
    javascriptGenerator.forBlock['sql_expression_single'] = function (block) {
      return EXPRESSION_SINGLE_GENERATOR(block, javascriptGenerator);
    };

    // === PASO 9: GENERADORES DML: COMPARACIONES ===
    javascriptGenerator.forBlock['sql_comparison'] = function (block) {
      return COMPARISON_GENERATOR(block, javascriptGenerator);
    };
    javascriptGenerator.forBlock['sql_quantified_comparison'] = function (block) {
      return QUANTIFIED_COMPARISON_GENERATOR(block, javascriptGenerator);
    };
    javascriptGenerator.forBlock['sql_membership'] = function (block) {
      return MEMBERSHIP_GENERATOR(block, javascriptGenerator);
    };


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

    // === Inicializar Blockly ===
    this.workspace = Blockly.inject(blocklyDiv, {
      toolbox: document.getElementById('toolbox'),
      theme: darkGlassTheme,
      renderer: 'geras',
      move: { //añadido, opción de scroll en menus
        scrollbars: true,
        drag: true,
        wheel: true
      }
    });

    // añadido, deshabilidar autoClose del flyout para que no se cierre al arrastrar bloques
    if (this.workspace.getFlyout()) {
      this.workspace.getFlyout().autoClose = false;

      // Fix doble click: escuchar clicks en el toolbox via DOM
      setTimeout(() => {

        const toolbox = this.workspace.getToolbox();
        // const toolboxDiv = document.querySelector('.blocklyToolbox');

        // toolboxDiv.addEventListener('click', () => {
        //   const selected = toolbox.getSelectedItem();
        //   console.log('selected:', selected);
        //   console.log('selected proto methods:', selected ? Object.getOwnPropertyNames(Object.getPrototypeOf(selected)) : 'null');
        //   console.log('toolbox proto methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(toolbox)));
        // });

        const dmlItem = toolbox.getToolboxItems().find(item =>
          item.getName?.() === 'Sentencias DML'
        );

        // console.log('dmlItem:', dmlItem);
        // console.log('dmlItem div:', dmlItem?.getDiv?.());

        const dmlDiv = dmlItem?.getDiv?.();
        if (dmlDiv) {
          let wasVisible = false;

          const observer = new MutationObserver(() => {
            const children = dmlItem.getChildToolboxItems();
            const isVisible = children.some(child => child.isVisible?.());

            // Si pasó de visible a no visible, re-seleccionar DML
            if (wasVisible && !isVisible) {
              setTimeout(() => toolbox.setSelectedItem(dmlItem), 50);
            }

            wasVisible = isVisible;
          });

          observer.observe(dmlDiv, {
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
          });
        }
      }, 200);
    }

    // === EFECTO CRISTAL AL FONDO INTERNO ===
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

    // === LISTENER PARA GENERAR CÓDIGO SQL ===
    this.workspace.addChangeListener(() => {
      const code = javascriptGenerator.workspaceToCode(this.workspace);
      console.log('SQL generado:', code);

      // Actualiza el div de SQL con el código generado
      if (sqlDiv && code.trim()) {
        sqlDiv.innerHTML = `
          <h2>Resultado de Query SQL</h2>
          <pre>${code}</pre>
        `;
      } else if (sqlDiv) {
        // Muestra el ejemplo si no hay bloques
        this.showSQLExample();
      }
    });

    // === EVENTOS DE INTERFAZ ===
    showMermaidBtn.addEventListener('click', () => {
      mermaidDiv.style.display =
        mermaidDiv.style.display === 'none' ? 'block' : 'none';
      this.resizeBlockly();
    });

    showOutputBtn.addEventListener('click', () => {
      sqlDiv.style.display =
        sqlDiv.style.display === 'none' ? 'block' : 'none';
      this.resizeBlockly();
    });

    showOpenBdBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openBdMenu.classList.toggle('active');
      exportBdMenu.classList.remove('active');
    });

    showExportBdBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportBdMenu.classList.toggle('active');
      openBdMenu.classList.remove('active');
    });

    document.addEventListener('click', () => {
      openBdMenu.classList.remove('active');
      exportBdMenu.classList.remove('active');
    });

    // === Mostrar ejemplos iniciales ===
    console.log('Blockly inicializado con bloques SQL + DISTINCT/TOP', this.workspace);
    this.showMermaidExample("Esquema_Estudiantes");
    this.showSQLExample();
  },

  resizeBlockly: function () {
    if (this.workspace) {
      Blockly.svgResize(this.workspace);
    }
  },

  showMermaidExample: async function (schemaName) {
    const mermaidDiv = document.getElementById('mermaidDiv');
    const diagram = `
erDiagram
  STUDENTS {
    int id
    string name
  }
  COURSES {
    int id
    string title
  }
  STUDENTS ||--|| COURSES : takes
    `;

    mermaidDiv.innerHTML = `
      <h2>Modelo Entidad-Relación — Esquema: 
        <span style="color:#00ff99">${schemaName}</span>
      </h2>
      <div id="mermaidDiagram"></div>
    `;

    try {
      const { svg } = await mermaid.render('er-diagram', diagram);
      document.getElementById('mermaidDiagram').innerHTML = svg;
    } catch (error) {
      console.error("Error rendering Mermaid diagram:", error);
      mermaidDiv.innerHTML += `<p>Error al renderizar diagrama</p>`;
    }
  },

  showSQLExample: function () {
    const sqlDiv = document.getElementById('sqlOutput');
    sqlDiv.innerHTML = `
      <h2>Resultado de Query SQL</h2>
      <pre>
SELECT DISTINCT TOP (10)
  producto,
  COUNT(DISTINCT cliente_id),
  SUM(total)
FROM ventas;

-- 💡 Tip: Click derecho en expresiones para agregar DISTINCT o TOP
      </pre>
    `;
  }
};
