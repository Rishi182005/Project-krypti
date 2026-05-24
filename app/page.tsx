"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type WH = { warehouseId: string; warehouseName: string; location: string; available: number; reserved: number };
type Product = { id: string; name: string; description: string | null; warehouses: WH[] };

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const load = () => {
    setLoading(true);
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function reserve(productId: string, warehouseId: string) {
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, warehouseId, quantity: 1 }),
    });
    const data = await res.json();
    if (res.status === 409) return alert(`Not enough stock. Available: ${data.available}`);
    if (!res.ok) return alert(`Error: ${data.error}`);
    router.push(`/reservation/${data.id}`);
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <button onClick={load} className="text-sm text-blue-600 hover:underline">Refresh</button>
      </div>
      <div className="space-y-6">
        {products.map((p) => (
          <div key={p.id} className="border rounded-xl p-5 shadow-sm">
            <h2 className="text-xl font-semibold">{p.name}</h2>
            {p.description && <p className="text-gray-500 text-sm mt-1">{p.description}</p>}
            <div className="mt-4 space-y-2">
              {p.warehouses.map((wh) => (
                <div key={wh.warehouseId} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div>
                    <p className="font-medium text-sm">{wh.warehouseName} — {wh.location}</p>
                    <p className="text-xs mt-0.5">
                      <span className={wh.available > 0 ? "text-green-600" : "text-red-500"}>
                        {wh.available} available
                      </span>
                      <span className="text-gray-400 ml-2">{wh.reserved} reserved</span>
                    </p>
                  </div>
                  <button
                    onClick={() => reserve(p.id, wh.warehouseId)}
                    disabled={wh.available === 0}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700"
                  >
                    Reserve
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}