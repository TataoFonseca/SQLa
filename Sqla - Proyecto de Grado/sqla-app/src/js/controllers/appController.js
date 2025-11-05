import * as Blockly from 'blockly';

export const AppController = {
  workspace: null,

  init: function () {
    // Referencias a elementos del DOM
    const blocklyDiv = document.getElementById('blocklyDiv');
    const showMermaidBtn = document.getElementById('showMermaidBtn');
    const showOutputBtn = document.getElementById('showOutputBtn');
    const showOpenBdBtn = document.getElementById('showOpenBdBtn');
    const showExportBdBtn = document.getElementById('showExportBdBtn');
    const mermaidDiv = document.getElementById('mermaidDiv');
    const sqlDiv = document.getElementById('sqlOutput');
    const openBdMenu = document.getElementById('openBdMenu');
    const exportBdMenu = document.getElementById('exportBdMenu');

    // Inicializar Blockly
    this.workspace = Blockly.inject(blocklyDiv, {
      toolbox: document.getElementById('toolbox'),
    });

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

    console.log('Blockly en funcionamiento', this.workspace);
  },

  // Método para redimensionar Blockly
  resizeBlockly: function () {
    if (this.workspace) {
      Blockly.svgResize(this.workspace);
    }
  },
};
