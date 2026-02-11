// src/js/controllers/appController.js

import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import mermaid from 'mermaid';

// BLOQUES DDL
import { CREATE_TABLE_DEFINITION, CREATE_TABLE_GENERATOR } from '../blocks/ddl_CreateTableBlock.js';
import { COLUMN_DEFINITION, COLUMN_GENERATOR } from '../blocks/ddl_ColumnDefinitionBlock.js';

// BLOQUES DML, INCLUYENDO LOS MEJORADOS CON DISTINCT Y TOP
import { FROM_DEFINITION, FROM_GENERATOR } from '../blocks/dml_FromBlock.js';
import { 
  SELECT_DEFINITION, 
  SELECT_GENERATOR, 
} from '../blocks/dml_SelectBlock.js'; 

import { 
  EXPRESSION_DEFINITION, 
  EXPRESSION_GENERATOR 
} from '../blocks/dml_ExpressionBlock.js'; 

// NUEVOS BLOQUES: DISTINCT Y TOP
import { DISTINCT_DEFINITION, DISTINCT_GENERATOR } from '../blocks/dml_DistinctBlock.js';
import { TOP_DEFINITION, TOP_GENERATOR } from '../blocks/dml_TopBlock.js';

// EXTENSIÓN DEL MENÚ CONTEXTUAL
import { registerExpressionContextMenu } from '../blocks/extensions/expressionContextMenu.js';

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose"
});

export const AppController = {
  workspace: null,
  
  init: function () {
    
    //REGISTRO DE LA EXTENSIÓN DEL MENÚ CONTEXTUAL (ANTES DE LOS BLOQUES) - SE USA EN EL BLOQUE DE EXPRESIÓN
    registerExpressionContextMenu();
    
    //REGISTRO DE BLOQUES (JSON) ===
    Blockly.defineBlocksWithJsonArray([
      // DDL
      CREATE_TABLE_DEFINITION,
      COLUMN_DEFINITION,
      
      // DML
      FROM_DEFINITION,
      SELECT_DEFINITION,
      EXPRESSION_DEFINITION,
      // bloquesDISTINCT Y TOP
      DISTINCT_DEFINITION,
      TOP_DEFINITION,
      
    ]);
    
    // === PASO 4: REGISTRO DE GENERADORES DDL ===
    javascriptGenerator.forBlock['sql_create_table'] = function(block) {
      return CREATE_TABLE_GENERATOR(block, javascriptGenerator);
    };

    javascriptGenerator.forBlock['sql_column_definition'] = function(block) {
      return COLUMN_GENERATOR(block, javascriptGenerator);
    };

    // === PASO 5: REGISTRA LOS GENERADORES DML ===
    javascriptGenerator.forBlock['sql_select'] = function(block) {
      return SELECT_GENERATOR(block, javascriptGenerator);
    };

    javascriptGenerator.forBlock['sql_expression'] = function(block) {
      return EXPRESSION_GENERATOR(block, javascriptGenerator);
    };

    javascriptGenerator.forBlock['sql_from'] = function(block) {
      return FROM_GENERATOR(block, javascriptGenerator);
    };
    
    // ⭐ PASO 6: GENERADORES PARA DISTINCT Y TOP
    javascriptGenerator.forBlock['sql_distinct'] = function(block) {
      return DISTINCT_GENERATOR(block, javascriptGenerator);
    };
    
    javascriptGenerator.forBlock['sql_top'] = function(block) {
      return TOP_GENERATOR(block, javascriptGenerator);
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
      renderer: 'geras'
    });
    
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
