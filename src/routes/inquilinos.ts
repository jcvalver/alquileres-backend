import { Router } from "express";
import {
  getInquilinos,
  getInquilinoById,
  createInquilino,
  updateInquilino,
  deleteInquilino,
} from "../controllers/inquilinos.controller";

const router = Router();

router.get("/", getInquilinos);
router.get("/:id", getInquilinoById);
router.post("/", createInquilino);
router.put("/:id", updateInquilino);
router.delete("/:id", deleteInquilino);

export default router;
