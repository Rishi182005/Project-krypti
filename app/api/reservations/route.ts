import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { z } from "zod";

const Schema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().int().positive(),
});

const TTL = Number(process.env.RESERVATION_TTL_MINUTES ?? 10);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const { productId, warehouseId, quantity } = parsed.data;

  const lockKey = `lock:${productId}:${warehouseId}`;
  const lockVal = crypto.randomUUID();
  const acquired = await redis.set(lockKey, lockVal, "PX", 5000, "NX");

  if (!acquired)
    return NextResponse.json({ error: "Server busy, retry" }, { status: 503 });

  try {
    const stock = await prisma.stock.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    });

    if (!stock)
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });

    const available = stock.total - stock.reserved;
    if (available < quantity)
      return NextResponse.json(
        { error: "Insufficient stock", available },
        { status: 409 }
      );

    const expiresAt = new Date(Date.now() + TTL * 60 * 1000);

    const [reservation] = await prisma.$transaction([
      prisma.reservation.create({
        data: { productId, warehouseId, quantity, status: "PENDING", expiresAt },
        include: { product: true, warehouse: true },
      }),
      prisma.stock.update({
        where: { productId_warehouseId: { productId, warehouseId } },
        data: { reserved: { increment: quantity } },
      }),
    ]);

    return NextResponse.json(reservation, { status: 201 });
  } finally {
    const lua = `if redis.call("get",KEYS[1])==ARGV[1] then return redis.call("del",KEYS[1]) else return 0 end`;
    await redis.eval(lua, 1, lockKey, lockVal);
  }
}