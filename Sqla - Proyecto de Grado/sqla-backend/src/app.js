import express from "express";
import sqlRoutes from "./routes/sql.routes.js";
import { existsSync } from "fs";
import { join, dirname } from "path";

// En pkg: dist/ está junto al .exe. En dev: Vite sirve el frontend, dist/ no existe.
const distPath = process.pkg
    ? join(dirname(process.execPath), "dist")
    : join(process.cwd(), "dist");

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

// En producción: dist/ existe y Express sirve el frontend.
// En dev: Vite corre en localhost:5173, así que solo se muestra un mensaje de prueba.
if (existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get(/^(?!\/api).*/, (req, res) => {
        res.sendFile(join(distPath, "index.html"));
    });
    console.log(`✅ Sirviendo frontend desde: ${distPath}`);
} else {
    app.get('/', (req, res) => {
        res.json({ message: 'Backend SQL Sandbox funcionando' });
    });
}

export default app;





