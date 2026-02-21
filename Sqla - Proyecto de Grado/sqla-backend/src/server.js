import express from "express";
import sqlRoutes from "./routes/sql.routes.js";

const app = express();
app.use(express.json());

app.use("/api/sql", sqlRoutes);

app.listen(3000, () => {
  console.log("Backend corriendo en http://localhost:3000");
});