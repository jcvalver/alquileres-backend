import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seeding de estados de pago...");

  const estados = [
    {
      nombre: "Pendiente",
      descripcion: "Pago aún no realizado",
      color_hex: "#FFA500",
      orden: 1,
    },
    {
      nombre: "Pagado",
      descripcion: "Pago realizado con éxito",
      color_hex: "#28A745",
      orden: 2,
    },
    {
      nombre: "Vencido",
      descripcion: "Pago vencido",
      color_hex: "#DC3545",
      orden: 3,
    },
  ];

  for (const estado of estados) {
    await prisma.estados_pago.upsert({
      where: { nombre: estado.nombre },
      update: {},
      create: estado,
    });
  }

  console.log("✅ Seeding completado: estados de pago creados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
