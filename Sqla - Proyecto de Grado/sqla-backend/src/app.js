import express from "express";
import cors from "cors";

import sqlRoutes from "./routes/sql.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/sql", sqlRoutes);

export default app;
