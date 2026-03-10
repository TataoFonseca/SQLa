import express from "express";
import sqlRoutes from "./routes/sql.routes.js";

const app = express();

// ==========================================
// MIDDLEWARE CORS MANUAL - VERSIÓN FUERTE
// ==========================================
app.use((req, res, next) => {
    console.log(`📡 Request recibido: ${req.method} ${req.url}`);
    console.log(`   Origin: ${req.headers.origin || 'no origin'}`);

    // Configurar headers CORS para TODAS las respuestas
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');

    // Responder a preflight requests (OPTIONS) inmediatamente
    if (req.method === 'OPTIONS') {
        console.log('✅ Respondiendo a preflight request');
        return res.sendStatus(200);
    }

    next();
});

// Middleware para parsear JSON
app.use(express.json());

// Rutas
app.use("/api/sql", sqlRoutes);

// Ruta de prueba para verificar que el servidor funciona
app.get('/', (req, res) => {
    res.json({ message: 'Backend SQL Sandbox funcionando' });
});

export default app;





