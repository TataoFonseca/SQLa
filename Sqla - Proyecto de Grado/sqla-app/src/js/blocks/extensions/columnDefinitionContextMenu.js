import * as Blockly from 'blockly';

// Mapeo de opciones del menú → tipos de constraint
const NUMERIC_TYPES = ['INTEGER', 'FLOAT'];

// Helper: comprueba si un input existe en el bloque
function hasConstraint(block, inputName) {
  return !!block.getInput(inputName);
}

// Helper: comprueba si el tipo de dato es numérico
function isNumeric(block) {
  return NUMERIC_TYPES.includes(block.getFieldValue('DATA_TYPE'));
}

// ── Añadir / Eliminar constraints ──────────────────────────────────────────

function addIdentity(block) {
  block.appendDummyInput('C_IDENTITY')
    .appendField('IDENTITY(')
    .appendField(new Blockly.FieldNumber(1, null, null, 1), 'IDENTITY_SEED')
    .appendField(',')
    .appendField(new Blockly.FieldNumber(1, null, null, 1), 'IDENTITY_INCREMENT')
    .appendField(')');
  block.moveInputBefore('C_IDENTITY', null);
}

function addNotNull(block) {
  block.appendDummyInput('C_NOT_NULL')
    .appendField('NOT NULL');
}

function addUnique(block) {
  block.appendDummyInput('C_UNIQUE')
    .appendField('UNIQUE');
  // Si hay DEFAULT, eliminarlo — no son compatibles
  if (hasConstraint(block, 'C_DEFAULT')) {
    block.removeInput('C_DEFAULT');
  }
}

function addDefault(block) {
  block.appendDummyInput('C_DEFAULT')
    .appendField('DEFAULT')
    .appendField(new Blockly.FieldTextInput('0'), 'DEFAULT_VALUE');
}

function addCheck(block) {
  block.appendDummyInput('C_CHECK')
    .appendField('CHECK (')
    .appendField(new Blockly.FieldTextInput('columna > 0'), 'CHECK_CONDITION')
    .appendField(')');
}

function addReferences(block) {
  block.appendDummyInput('C_REFERENCES')
    .appendField('REFERENCES')
    .appendField(new Blockly.FieldTextInput('tabla_ref'), 'REF_TABLE')
    .appendField('(')
    .appendField(new Blockly.FieldTextInput('id'), 'REF_COLUMN')
    .appendField(')');
}

// ── Extensión ──────────────────────────────────────────────────────────────

export const COLUMN_DEFINITION_CONTEXT_MENU = {
  name: 'column_definition_context_menu',
  mixin: {
    customContextMenu(options) {
      const block = this;

      // IDENTITY — solo si tipo numérico
      if (isNumeric(block)) {
        if (!hasConstraint(block, 'C_IDENTITY')) {
          options.push({
            text: '➕ Añadir IDENTITY',
            enabled: true,
            callback: () => addIdentity(block)
          });
        } else {
          options.push({
            text: '❌ Eliminar IDENTITY',
            enabled: true,
            callback: () => block.removeInput('C_IDENTITY')
          });
        }
      }

      // NOT NULL
      if (!hasConstraint(block, 'C_NOT_NULL')) {
        options.push({
          text: '➕ Añadir NOT NULL',
          enabled: true,
          callback: () => addNotNull(block)
        });
      } else {
        options.push({
          text: '❌ Eliminar NOT NULL',
          enabled: true,
          callback: () => block.removeInput('C_NOT_NULL')
        });
      }

      // UNIQUE
      if (!hasConstraint(block, 'C_UNIQUE')) {
        options.push({
          text: '➕ Añadir UNIQUE',
          enabled: true,
          callback: () => addUnique(block)
        });
      } else {
        options.push({
          text: '❌ Eliminar UNIQUE',
          enabled: true,
          callback: () => block.removeInput('C_UNIQUE')
        });
      }

      // DEFAULT — solo si no hay UNIQUE
      if (!hasConstraint(block, 'C_UNIQUE')) {
        if (!hasConstraint(block, 'C_DEFAULT')) {
          options.push({
            text: '➕ Añadir DEFAULT',
            enabled: true,
            callback: () => addDefault(block)
          });
        } else {
          options.push({
            text: '❌ Eliminar DEFAULT',
            enabled: true,
            callback: () => block.removeInput('C_DEFAULT')
          });
        }
      }

      // CHECK
      if (!hasConstraint(block, 'C_CHECK')) {
        options.push({
          text: '➕ Añadir CHECK',
          enabled: true,
          callback: () => addCheck(block)
        });
      } else {
        options.push({
          text: '❌ Eliminar CHECK',
          enabled: true,
          callback: () => block.removeInput('C_CHECK')
        });
      }

      // REFERENCES
      if (!hasConstraint(block, 'C_REFERENCES')) {
        options.push({
          text: '➕ Añadir REFERENCES',
          enabled: true,
          callback: () => addReferences(block)
        });
      } else {
        options.push({
          text: '❌ Eliminar REFERENCES',
          enabled: true,
          callback: () => block.removeInput('C_REFERENCES')
        });
      }

      // Separador
      options.push({ text: '─────────────', enabled: false, callback: () => {} });

      // Convertir a Primary Key — Fase 2
      // TODO: añadir cuando ddl_ColumnPrimaryKey.js esté integrado
    }
  }
};