// assets/js/views/blocklyView.js

import * as Blockly from 'blockly'; // <-- aquí va al inicio

const BlocklyView = (() => {
  let workspace = null;

  function initBlockly(containerId) {
    workspace = Blockly.inject(containerId, {
      toolbox: `
        <xml>
          <block type="controls_if"></block>
          <block type="logic_compare"></block>
          <block type="math_number"></block>
          <block type="text"></block>
          <block type="variables_set"></block>
          <block type="variables_get"></block>
        </xml>
      `,
      trashcan: true
    });

    workspace.addChangeListener(() => {
      const code = Blockly.JavaScript.workspaceToCode(workspace);
      console.log("Código generado:");
      console.log(code);
    });
  }

  function getWorkspace() {
    return workspace;
  }

  return { initBlockly, getWorkspace };
})();
