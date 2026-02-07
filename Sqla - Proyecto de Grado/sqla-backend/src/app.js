import express from "express";
import cors from "cors";
import queryRoutes from "./routes/query.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "SQLa backend funcionando 🚀" });
});

app.use("/query", queryRoutes);

export default app;