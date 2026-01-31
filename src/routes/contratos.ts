import { Router } from "express";
import { getContratos, getContratoById, createContrato, updateContrato, deleteContrato, getContratosVigentes,
    getContratosVencidos,
    getContratosPorVencer,
    getResumenContratos } from "../controllers/contratos.controller";

const router = Router();

// Rutas CRUD
router.get("/", getContratos);
router.get("/:id", getContratoById);
router.post("/", createContrato);
router.put("/:id", updateContrato);
router.delete("/:id", deleteContrato);
router.get("/vigentes", getContratosVigentes);
router.get("/vencidos", getContratosVencidos);
router.get("/por-vencer", getContratosPorVencer);
router.get("/resumen", getResumenContratos);

export default router;
