import { Router } from "express";
import {
  getProdutos,
  criarProduto,
  getProdutosPorId,
  atualizarProduto,
  deletarProduto,
} from "../controllers/produtoController.js";

const router = Router();

router.get("/", getProdutos);
router.get("/:id", getProdutosPorId);
router.post("/", criarProduto);
router.patch("/:id", atualizarProduto);
router.delete("/:id", deletarProduto);

export const produtoRoutes = router;
