import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      stocks: { include: { warehouse: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    warehouses: p.stocks.map((s) => ({
      warehouseId: s.warehouseId,
      warehouseName: s.warehouse.name,
      location: s.warehouse.location,
      total: s.total,
      reserved: s.reserved,
      available: s.total - s.reserved,
    })),
  }));

  return NextResponse.json(result);
}