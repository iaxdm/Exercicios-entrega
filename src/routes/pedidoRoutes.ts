import { Router } from "express";
import {
  deletarPedido,
  postPedido,
  putPedido,
  getPedidos,
  patchStatus,
  getPedidosRelatorio,
} from "../controllers/pedidoController.js";

const router = Router();

router.post("/", postPedido);
router.get("/relatorio", getPedidosRelatorio);
router.get("/", getPedidos);
router.delete("/:id", deletarPedido);
router.patch("/:id", patchStatus);
router.put("/:id", putPedido);

export const pedidosRoutes = router;
