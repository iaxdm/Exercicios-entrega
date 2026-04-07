import { Router } from "express";
import {
  deletarPedido,
  postPedido,
  putPedido,
} from "../controllers/pedidoController.js";
import { getPedidos } from "../controllers/pedidoController.js";
import { patchStatus } from "../controllers/pedidoController.js";

const router = Router();

router.post("/", postPedido);
router.get("/", getPedidos);
router.delete("/:id", deletarPedido);
router.patch("/:id", patchStatus);
router.put("/:id", putPedido);

export const pedidosRoutes = router;
