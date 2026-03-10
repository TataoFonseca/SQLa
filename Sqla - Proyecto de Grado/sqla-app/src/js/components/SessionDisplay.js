// sqla-app/src/js/components/SessionDisplay.js
import { apiService } from '../services/apiService.js';

export class SessionDisplay {
    constructor() {
        this.element = this.createDisplay();
        this.setupListeners();
        this.updateDisplay();
    }

    createDisplay() {
        const container = document.createElement('div');
        container.className = 'session-display';
        container.innerHTML = `
            <div class="session-card">
                <div class="session-header">
                    <span class="session-icon">🔐</span>
                    <span class="session-title">Sesión Activa</span>
                </div>
                <div class="session-body">
                    <div class="session-row">
                        <span class="session-label">UUID:</span>
                        <span class="session-value" id="sessionUuid">-</span>
                        <button class="session-copy-btn" id="copyUuidBtn" title="Copiar UUID">
                            📋
                        </button>
                    </div>
                    <div class="session-row">
                        <span class="session-label">Schema:</span>
                        <span class="session-value" id="sessionSchema">-</span>
                    </div>
                    <div class="session-actions">
                        <button class="session-btn session-btn-primary" id="newSessionBtn">
                            ➕ Nueva Sesión
                        </button>
                        <button class="session-btn session-btn-secondary" id="loadSessionBtn">
                            📂 Cargar UUID
                        </button>
                    </div>
                </div>
            </div>

            <!-- Modal para cargar UUID -->
            <div class="session-modal" id="loadSessionModal" style="display: none;">
                <div class="session-modal-content">
                    <h3>Cargar Sesión por UUID</h3>
                    <input type="text" id="sessionUuidInput" placeholder="Ingresa el UUID de la sesión">
                    <div class="session-modal-actions">
                        <button class="session-btn session-btn-primary" id="confirmLoadBtn">Cargar</button>
                        <button class="session-btn session-btn-secondary" id="cancelLoadBtn">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        return container;
    }

    setupListeners() {
        // Copiar UUID
        this.element.querySelector('#copyUuidBtn').addEventListener('click', () => {
            this.copyUuidToClipboard();
        });

        // Nueva sesión
        this.element.querySelector('#newSessionBtn').addEventListener('click', async () => {
            await this.createNewSession();
        });

        // Abrir modal de carga
        this.element.querySelector('#loadSessionBtn').addEventListener('click', () => {
            this.element.querySelector('#loadSessionModal').style.display = 'flex';
        });

        // Confirmar carga
        this.element.querySelector('#confirmLoadBtn').addEventListener('click', async () => {
            await this.loadSession();
        });

        // Cancelar carga
        this.element.querySelector('#cancelLoadBtn').addEventListener('click', () => {
            this.element.querySelector('#loadSessionModal').style.display = 'none';
            this.element.querySelector('#sessionUuidInput').value = '';
        });

        // Cerrar modal al hacer clic fuera
        this.element.querySelector('#loadSessionModal').addEventListener('click', (e) => {
            if (e.target === this.element.querySelector('#loadSessionModal')) {
                this.element.querySelector('#loadSessionModal').style.display = 'none';
            }
        });
    }

    async createNewSession() {
        try {
            const result = await apiService.createSession();
            if (result.ok) {
                this.updateDisplay();
                this.showNotification('✅ Nueva sesión creada', 'success');
            }
        } catch (error) {
            this.showNotification('❌ Error al crear sesión', 'error');
        }
    }

    async loadSession() {
        const uuid = this.element.querySelector('#sessionUuidInput').value.trim();
        if (!uuid) {
            this.showNotification('⚠️ Ingresa un UUID válido', 'warning');
            return;
        }

        try {
            const result = await apiService.loadSession(uuid);
            if (result.ok) {
                this.element.querySelector('#loadSessionModal').style.display = 'none';
                this.element.querySelector('#sessionUuidInput').value = '';
                this.updateDisplay();
                this.showNotification('✅ Sesión cargada', 'success');
            } else {
                this.showNotification('❌ UUID no válido', 'error');
            }
        } catch (error) {
            this.showNotification('❌ Error al cargar sesión', 'error');
        }
    }

    updateDisplay() {
        const session = apiService.getCurrentSession();
        const uuidEl = this.element.querySelector('#sessionUuid');
        const schemaEl = this.element.querySelector('#sessionSchema');

        if (session.sessionId) {
            uuidEl.textContent = session.sessionId;
            schemaEl.textContent = session.schema;
            uuidEl.style.color = '#00ff87';
            schemaEl.style.color = '#60efff';
        } else {
            uuidEl.textContent = '-';
            schemaEl.textContent = '-';
        }
    }

    async copyUuidToClipboard() {
        const session = apiService.getCurrentSession();
        if (!session.sessionId) {
            this.showNotification('⚠️ No hay sesión activa', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(session.sessionId);
            this.showNotification('📋 UUID copiado al portapapeles', 'success');
        } catch (err) {
            this.showNotification('❌ Error al copiar', 'error');
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? 'linear-gradient(135deg, #00b09b, #96c93d)' :
                type === 'error' ? 'linear-gradient(135deg, #ff416c, #ff4b2b)' :
                    type === 'warning' ? 'linear-gradient(135deg, #f7971e, #ffd200)' :
                        'linear-gradient(135deg, #2193b0, #6dd5ed)'};
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    render() {
        return this.element;
    }
}





