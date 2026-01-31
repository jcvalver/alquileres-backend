import { Router } from "express";
import {
  getTiposPago,
  getTipoPagoById,
  createTipoPago,
  updateTipoPago,
  deleteTipoPago,
} from "../controllers/tiposPago.controller";

const router = Router();

router.get("/", getTiposPago);
router.get("/:id", getTipoPagoById);
router.post("/", createTipoPago);
router.put("/:id", updateTipoPago);
router.delete("/:id", deleteTipoPago);

export default router;
