import { Router } from "express";
import { getResumenGeneral, getPagosPorPeriodo, getPagosAtrasados, getDashboard, getContratosActivos } from "../controllers/reportes.controller";

const router = Router();

router.get("/resumen", getResumenGeneral);
router.get("/pagos", getPagosPorPeriodo); // /api/reportes/pagos?year=2025&month=09
router.get("/atrasados", getPagosAtrasados);
router.get("/dashboard", getDashboard);
router.get("/pagos-atrasados", getPagosAtrasados);
router.get("/contratos-activos", getContratosActivos);
export default router;
