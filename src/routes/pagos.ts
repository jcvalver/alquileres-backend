import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getPagos, getPagoById, createPago, updatePago, deletePago, getPagosByContrato, getDeudas, getResumenMensual, getPagosAgrupadosPorContrato, } from "../controllers/pagos.controller";

const router = Router();

// Configuración de multer para almacenar comprobantes y recibos
const uploadDirComprobantes = path.join(process.cwd(), "uploads", "comprobantes");
const uploadDirRecibos = path.join(process.cwd(), "uploads", "recibos");

// Asegurar existencia de los directorios de uploads
try {
	fs.mkdirSync(uploadDirComprobantes, { recursive: true });
	fs.mkdirSync(uploadDirRecibos, { recursive: true });
} catch (e) {
	// ignore
}

const storage = multer.diskStorage({
	destination: (_req: any, file: any, cb: any) => {
			if (file.fieldname === "comprobante") return cb(null, uploadDirComprobantes);
			// accept only 'recibo' as the file field for recibos
			if (file.fieldname === "recibo") return cb(null, uploadDirRecibos);
		// fallback
		return cb(null, path.join(process.cwd(), "uploads"));
	},
	filename: (_req: any, file: any, cb: any) => {
		const unique = `${Date.now()}-${file.originalname}`.replace(/\s+/g, "_");
		cb(null, unique);
	},
});

// Limite: 5MB por archivo
const upload = multer({
	storage,
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		// Validación rápida (cabecera/mimetype). La validación estricta se hace en controller con file-type.
		if (!file.mimetype || !file.mimetype.startsWith("image/")) {
			return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
		}
		return cb(null, true);
	},
});

// Rutas CRUD
router.get("/contrato/:contratoId", getPagosByContrato);
router.get("/deudas/activas", getDeudas);
router.get("/resumen/mensual", getResumenMensual);
router.get("/agrupados", getPagosAgrupadosPorContrato);
router.get("/", getPagos);
router.get("/:id", getPagoById);
// accept only 'recibo' as the file field
router.post(
	"/",
	upload.fields([
		{ name: "comprobante", maxCount: 1 },
		{ name: "recibo", maxCount: 1 },
	]),
	createPago
);
router.put(
	"/:id",
	upload.fields([
		{ name: "comprobante", maxCount: 1 },
		{ name: "recibo", maxCount: 1 },
	]),
	updatePago
);
router.delete("/:id", deletePago);

export default router;
