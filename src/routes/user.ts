import { Router } from "express";
import { getUsers, getUserById, updateUser, deleteUser } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/", authMiddleware,getUsers);
router.get("/:id", authMiddleware,getUserById);
router.put("/:id", authMiddleware, updateUser);
router.delete("/:id", authMiddleware,deleteUser);

export default router;
