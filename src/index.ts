import express from "express";
import type { Application } from "express";
import { pool } from "./db.js";
import { produtoRoutes } from "./routes/produtoRoutes.js";
import { pedidosRoutes } from "./routes/pedidoRoutes.js";

const app: Application = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/produtos", produtoRoutes);
app.use("/api/pedidos", pedidosRoutes);

app.get("/api", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT NOW()");
    res.json({ message: "Node 25 + TS rodando!", dbTime: rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Erro ao conectar no banco" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
