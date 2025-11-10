// src/js/controllers/appController.js
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import mermaid from 'mermaid';

// IMPORTA TUS BLOQUES
import { SELECT_DEFINITION, SELECT_GENERATOR } from '../blocks/dml_SelectBlock.js'; 
import { FROM_DEFINITION, FROM_GENERATOR } from '../blocks/dml_FromBlock.js';

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose"
});

export const AppController = {
  workspace: null,
  
  init: function () {
    // === REGISTRA LOS BLOQUES (JSON) ===
    Blockly.defineBlocksWithJsonArray([
      SELECT_DEFINITION, 
      FROM_DEFINITION 
    ]);
    
    // === REGISTRA LOS GENERADORES ===
    javascriptGenerator['sql_select'] = SELECT_GENERATOR;
    javascriptGenerator['sql_from'] = FROM_GENERATOR;
    
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
    
    // === APLICAR EFECTO CRISTAL AL FONDO INTERNO ===
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
        //this.showSQLExample();
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
    console.log('Blockly inicializado con bloques SQL', this.workspace);
    this.showMermaidExample("Esquema_Estudiantes");
    // this.showSQLExample();
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
SELECT s.name, c.title
FROM students s
JOIN courses c ON s.id = c.id
WHERE s.age > 18;
      </pre>
    `;
  }
};