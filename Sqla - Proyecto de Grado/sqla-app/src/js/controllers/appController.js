import * as Blockly from 'blockly';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose"
});

export const AppController = {
  workspace: null,

  init: function () {

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
      theme: darkGlassTheme, // Aplicar el tema personalizado
      renderer: 'geras' // Renderizador que funciona mejor con temas oscuros
    });

    // === APLICAR EFECTO CRISTAL AL FONDO INTERNO ===
    setTimeout(() => {
      const blocklyBackground = document.querySelector('.blocklyMainBackground');
      if (blocklyBackground) {
        blocklyBackground.setAttribute('fill', 'transparent');
      }
      
    // También personalizar la cuadrícula
      const gridPattern = document.querySelector('.blocklyGridPattern');
      if (gridPattern) {
        gridPattern.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
      }
    }, 100);

    Blockly.svgResize(this.workspace);
    window.addEventListener('resize', () => Blockly.svgResize(this.workspace));

    // === EVENTOS DE INTERFAZ ===

    // Mostrar / ocultar Mermaid
    showMermaidBtn.addEventListener('click', () => {
      mermaidDiv.style.display =
        mermaidDiv.style.display === 'none' ? 'block' : 'none';
      this.resizeBlockly();
    });

    // Mostrar / ocultar SQL Output
    showOutputBtn.addEventListener('click', () => {
      sqlDiv.style.display =
        sqlDiv.style.display === 'none' ? 'block' : 'none';
      this.resizeBlockly();
    });

    // Abrir combo "Abrir BD"
    showOpenBdBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Evita cierre inmediato
      openBdMenu.classList.toggle('active');
      exportBdMenu.classList.remove('active'); // Cierra el otro
    });

    // Abrir combo "Exportar BD"
    showExportBdBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportBdMenu.classList.toggle('active');
      openBdMenu.classList.remove('active');
    });

    // Cerrar menús al hacer clic fuera
    document.addEventListener('click', () => {
      openBdMenu.classList.remove('active');
      exportBdMenu.classList.remove('active');
    });

    // === Mostrar ejemplos iniciales ===
    console.log('Blockly en funcionamiento', this.workspace);
    this.showMermaidExample("Esquema_Estudiantes");
    this.showSQLExample();
  },

  // === Método para redimensionar Blockly ===
  resizeBlockly: function () {
    if (this.workspace) {
      Blockly.svgResize(this.workspace);
    }
  },

  // Mostrar ejemplo Mermaid (diagrama ER) 
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

    // Generar HTML contenedor
    mermaidDiv.innerHTML = `
      <h2>Modelo Entidad-Relación — Esquema: 
        <span style="color :#00ff99">${schemaName}</span>
      </h2>
      <div id="mermaidDiagram"></div>
    `;

    try {
      // Renderizar diagrama 
      const { svg } = await mermaid.render('er-diagram', diagram);
      document.getElementById('mermaidDiagram').innerHTML = svg;
    } catch (error) {
      console.error("Error rendering Mermaid diagram:", error);
      mermaidDiv.innerHTML += `<p> Error al renderizar diagrama</p>`;
    }
  },

  // Mostrar SQL de ejemplo
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
