import * as Blockly from 'blockly';

export const AppController = {
  workspace: null,
  
  init: function() {
    const blocklyDiv = document.getElementById('blocklyDiv');
    
    // Inicializa Blockly
    this.workspace = Blockly.inject('blocklyDiv', {
      toolbox: document.getElementById('toolbox')
    });

    // Si quieres asegurar que tome el tamaño del div inicial
    Blockly.svgResize(this.workspace);

    window.addEventListener('resize', () => Blockly.svgResize(this.workspace));
    console.log('Blockly inicializado', this.workspace);
  },
  // Método opcional para cambiar tamaño dinámicamente
  resizeBlockly: function() {
    if (this.workspace) {
      Blockly.svgResize(this.workspace);
    }
  }
};
