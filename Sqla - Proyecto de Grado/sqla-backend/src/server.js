import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(3000, '0.0.0.0', () => {
  console.log(`✅ Backend corriendo en http://localhost:3000`);
  console.log(`✅ También accesible desde la red local y Tailscale`);
  console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
  console.log(`✅ También accesible desde http://127.0.0.1:${PORT}`);
});





