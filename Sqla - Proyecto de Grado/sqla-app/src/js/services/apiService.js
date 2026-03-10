// sqla-app/src/js/services/apiService.js

const API_BASE_URL = 'http://localhost:3000/api/sql'; // Ajusta el puerto si es diferente

class ApiService {
    constructor() {
        this.currentSessionId = null;
        this.currentSchema = null;
    }

    // ==========================================
    // 1. CREAR NUEVA SESIÓN
    // ==========================================
    async createSession() {
        try {
            console.log('📤 Creando nueva sesión...');
            
            const response = await fetch(`${API_BASE_URL}/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                // No enviamos body, el backend genera el UUID
            });

            const data = await response.json();
            console.log('📥 Respuesta:', data);

            if (data.ok) {
                this.currentSessionId = data.sessionId;
                this.currentSchema = data.schemaName;
                
                // Guardar en localStorage para persistencia
                localStorage.setItem('sqlSessionId', data.sessionId);
                localStorage.setItem('sqlSchema', data.schemaName);
            }

            return data;
        } catch (error) {
            console.error('❌ Error en createSession:', error);
            return { ok: false, error: error.message };
        }
    }

    // ==========================================
    // 2. CARGAR SESIÓN EXISTENTE POR UUID
    // ==========================================
    async loadSession(sessionId) {
        try {
            console.log('📤 Cargando sesión:', sessionId);
            
            const response = await fetch(`${API_BASE_URL}/session/${sessionId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log('📥 Respuesta:', data);

            if (data.ok) {
                this.currentSessionId = data.id;
                this.currentSchema = data.schema_name;
                
                localStorage.setItem('sqlSessionId', data.id);
                localStorage.setItem('sqlSchema', data.schema_name);
            }

            return data;
        } catch (error) {
            console.error('❌ Error en loadSession:', error);
            return { ok: false, error: error.message };
        }
    }

    // ==========================================
    // 3. EJECUTAR CONSULTA SQL (⭐ EL MÁS IMPORTANTE)
    // ==========================================
    async executeQuery(sql) {
        // Verificar que hay una sesión activa
        if (!this.currentSessionId) {
            // Intentar recuperar de localStorage
            const storedId = localStorage.getItem('sqlSessionId');
            if (storedId) {
                this.currentSessionId = storedId;
                this.currentSchema = localStorage.getItem('sqlSchema');
            } else {
                throw new Error('No hay sesión activa. Crea o carga una sesión primero.');
            }
        }

        try {
            console.log('📤 Enviando consulta al backend:');
            console.log('   Session ID:', this.currentSessionId);
            console.log('   SQL:', sql);

            // ⭐ ESTRUCTURA JSON QUE ENVÍAS AL BACKEND
            const requestBody = {
                sessionId: this.currentSessionId,
                sql: sql
            };

            console.log('📦 JSON enviado:', JSON.stringify(requestBody, null, 2));

            const response = await fetch(`${API_BASE_URL}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            
            // ⭐ ESTRUCTURA JSON QUE RECIBES DEL BACKEND
            console.log('📥 Respuesta del backend:');
            console.log('   Status:', response.status);
            console.log('   Data:', JSON.stringify(data, null, 2));

            return data;
        } catch (error) {
            console.error('❌ Error en executeQuery:', error);
            throw error;
        }
    }

    // ==========================================
    // 4. OBTENER HISTORIAL DE CONSULTAS
    // ==========================================
    async getHistory() {
        if (!this.currentSessionId) return [];

        try {
            const response = await fetch(`${API_BASE_URL}/history/${this.currentSessionId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            return data.ok ? data.data : [];
        } catch (error) {
            console.error('❌ Error en getHistory:', error);
            return [];
        }
    }

    // ==========================================
    // 5. UTILIDADES
    // ==========================================
    getCurrentSession() {
        return {
            sessionId: this.currentSessionId,
            schema: this.currentSchema
        };
    }

    clearSession() {
        this.currentSessionId = null;
        this.currentSchema = null;
        localStorage.removeItem('sqlSessionId');
        localStorage.removeItem('sqlSchema');
    }

    // Verificar si hay sesión guardada al iniciar
    checkStoredSession() {
        const storedId = localStorage.getItem('sqlSessionId');
        if (storedId) {
            this.currentSessionId = storedId;
            this.currentSchema = localStorage.getItem('sqlSchema');
            console.log('🔄 Sesión recuperada:', this.currentSessionId);
            return true;
        }
        return false;
    }
}

// Exportar una instancia única (singleton)
export const apiService = new ApiService();