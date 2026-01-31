import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";

export async function register(req: Request, res: Response) {
  try {
    const { nombre, email, password, rol } = req.body;
    const existing = await prisma.usuarios.findUnique({ where: { email }});
    if (existing) return res.status(400).json({ message: "Email ya registrado" });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.usuarios.create({
      data: { nombre, email, password_hash, rol: rol || "admin" }
    });
    res.status(201).json({ id: user.id, nombre: user.nombre, email: user.email });
  } catch (error: any) {
    console.error("Error en registro:", error); // log completo
    res.status(500).json({ message: error.message, stack: error.stack });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await prisma.usuarios.findUnique({ where: { email }});
    if (!user) return res.status(401).json({ message: "Credenciales inválidas" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: "Credenciales inválidas" });

    const secret = process.env.JWT_SECRET as string;
    const token = jwt.sign({ userId: user.id, email: user.email, rol: user.rol }, secret, { expiresIn: "8h" });

    res.json({ token, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }});
  } catch (err) {
    res.status(500).json({ error: err });
  }
}
