import { Router } from "express";
import {
  getEstadosPago,
  getEstadoPagoById,
  createEstadoPago,
  updateEstadoPago,
  deleteEstadoPago,
} from "../controllers/estadosPago.controller";

const router = Router();

router.get("/", getEstadosPago);
router.get("/:id", getEstadoPagoById);
router.post("/", createEstadoPago);
router.put("/:id", updateEstadoPago);
router.delete("/:id", deleteEstadoPago);

export default router;
