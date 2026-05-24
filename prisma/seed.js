const { PrismaClient } = require("../app/generated/prisma/index.js");
const prisma = new PrismaClient();

async function main() {
  const mumbai = await prisma.warehouse.upsert({ where: { id: "wh-mumbai" }, update: {}, create: { id: "wh-mumbai", name: "Mumbai Hub", location: "Mumbai, MH" } });
  const delhi = await prisma.warehouse.upsert({ where: { id: "wh-delhi" }, update: {}, create: { id: "wh-delhi", name: "Delhi Hub", location: "New Delhi, DL" } });
  const chennai = await prisma.warehouse.upsert({ where: { id: "wh-chennai" }, update: {}, create: { id: "wh-chennai", name: "Chennai Hub", location: "Chennai, TN" } });

  const p1 = await prisma.product.upsert({ where: { id: "prod-sneakers" }, update: {}, create: { id: "prod-sneakers", name: "Air Runner Pro", description: "Lightweight running shoe" } });
  const p2 = await prisma.product.upsert({ where: { id: "prod-headphones" }, update: {}, create: { id: "prod-headphones", name: "ProSound X1", description: "Noise-cancelling headphones" } });
  const p3 = await prisma.product.upsert({ where: { id: "prod-watch" }, update: {}, create: { id: "prod-watch", name: "SmartWatch Z", description: "Fitness tracking smartwatch" } });

  for (const [pid, wid, total] of [
    [p1.id, mumbai.id, 5], [p1.id, delhi.id, 3], [p1.id, chennai.id, 1],
    [p2.id, mumbai.id, 1], [p2.id, delhi.id, 2],
    [p3.id, chennai.id, 4], [p3.id, mumbai.id, 2],
  ]) {
    await prisma.stock.upsert({
      where: { productId_warehouseId: { productId: pid, warehouseId: wid } },
      update: {},
      create: { productId: pid, warehouseId: wid, total, reserved: 0 },
    });
  }
  console.log("Seeded ✓");
}

main().catch(console.error).finally(() => prisma.$disconnect());