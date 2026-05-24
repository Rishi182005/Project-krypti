import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const r = await tx.reservation.findUnique({ where: { id } });
      if (!r) throw new Error("NOT_FOUND");
      if (r.status === "CONFIRMED") return r;
      if (r.status === "RELEASED") throw new Error("RELEASED");
      if (r.expiresAt < new Date()) {
        await tx.stock.update({
          where: { productId_warehouseId: { productId: r.productId, warehouseId: r.warehouseId } },
          data: { reserved: { decrement: r.quantity } },
        });
        await tx.reservation.update({ where: { id }, data: { status: "RELEASED" } });
        throw new Error("EXPIRED");
      }
      return tx.reservation.update({
        where: { id },
        data: { status: "CONFIRMED" },
        include: { product: true, warehouse: true },
      });
    });
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (msg === "EXPIRED") return NextResponse.json({ error: "Reservation expired" }, { status: 410 });
    if (msg === "RELEASED") return NextResponse.json({ error: "Already released" }, { status: 409 });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}