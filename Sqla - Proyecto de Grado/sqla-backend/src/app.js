import express from "express";
import sqlRoutes from "./routes/sql.routes.js";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// En producción (empaquetado con pkg), dist/ vive junto al .exe.
// En desarrollo, está en sqla-app/dist/ (solo existe si se corrió vite build).
const distPath = process.pkg
    ? join(dirname(process.execPath), "dist")
    : join(__dirname, "..", "..", "sqla-app", "dist");

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

// ==========================================
// SERVIR FRONTEND ESTÁTICO (solo producción)
// En dev, Vite corre en localhost:5173 por separado.
// En producción (instalador), dist/ existe y Express sirve todo.
// ==========================================
if (existsSync(distPath)) {
    app.use(express.static(distPath));
    // Catch-all para SPA: cualquier ruta que no sea /api/* devuelve index.html
    app.get(/^(?!\/api).*/, (req, res) => {
        res.sendFile(join(distPath, "index.html"));
    });
    console.log(`✅ Sirviendo frontend desde: ${distPath}`);
}

export default app;





