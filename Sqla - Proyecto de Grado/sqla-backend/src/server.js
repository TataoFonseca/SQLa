
import app from "./app.js";
import { getPool } from "./db/mssql.js";

const PORT = process.env.PORT || 3000;

app.listen(3000, '0.0.0.0', async () => {
  console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
  console.log(`✅ También accesible desde http://127.0.0.1:${PORT}`);
  console.log("✅ También accesible desde la red local y Tailscale");

  // Pre-calentar el pool al arrancar para evitar timeout en la primera consulta del usuario
  try {
    await getPool();
    console.log("✅ Pool de base de datos pre-calentado");
  } catch (err) {
    console.warn("⚠️  No se pudo pre-calentar el pool:", err.message);
    // No es fatal — el pool se intentará conectar al primer request
  }
});
