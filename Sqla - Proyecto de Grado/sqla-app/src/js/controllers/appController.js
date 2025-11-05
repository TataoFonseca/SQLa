// src/js/controllers/appController.js
import * as Blockly from 'blockly';

// 1. IMPORTA EL GENERADOR DE CÓDIGO (LA FORMA MODERNA)
import { javascriptGenerator } from 'blockly/javascript';

// 2. IMPORTA TUS BLOQUES (Esto asume que fromBlock.js ya tiene contenido)
import { SELECT_DEFINITION, SELECT_GENERATOR } from '../blocks/selectBlock.js'; 
import { FROM_DEFINITION, FROM_GENERATOR } from '../blocks/fromBlock.js'; 

export const AppController = {
  workspace: null,
  
  init: function() {
    
    // 3. REGISTRA LOS BLOQUES (JSON)
    Blockly.defineBlocksWithJsonArray([
        SELECT_DEFINITION, 
        FROM_DEFINITION 
    ]); 
    
    // 4. REGISTRA LOS GENERADORES (Usando el objeto importado)
    javascriptGenerator['sql_select'] = SELECT_GENERATOR;
    javascriptGenerator['sql_from'] = FROM_GENERATOR;

    // 5. INYECTA BLOCKLY
    this.workspace = Blockly.inject('blocklyDiv', {
      toolbox: document.getElementById('toolbox')
    });

    // 6. REDIMENSIONA
    Blockly.svgResize(this.workspace);
    window.addEventListener('resize', () => this.resizeBlockly());
    
    // 7. AÑADE EL LISTENER PARA VER EL CÓDIGO
    this.workspace.addChangeListener(() => {
        // Usa el generador importado para convertir el workspace a código
        const code = javascriptGenerator.workspaceToCode(this.workspace);
        
        // Muestra el código en la consola
        console.log(code); 
        
        // Opcional: Muestra el código en tu div 'sqlOutput'
        const sqlDiv = document.getElementById('sqlOutput');
        if (sqlDiv) {
            sqlDiv.textContent = code;
        }
    });

    console.log('Blockly inicializado con bloques SQL', this.workspace);
  },
  
  resizeBlockly: function() {
    if (this.workspace) {
      Blockly.svgResize(this.workspace);
    }
  }
};