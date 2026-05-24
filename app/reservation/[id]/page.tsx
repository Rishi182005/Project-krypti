"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Reservation = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "RELEASED";
  quantity: number;
  expiresAt: string;
  product: { name: string };
  warehouse: { name: string; location: string };
};

function Countdown({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const [secs, setSecs] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  );

  useEffect(() => {
    if (secs === 0) { onExpire(); return; }
    const t = setInterval(() => setSecs((s) => { if (s <= 1) { clearInterval(t); onExpire(); return 0; } return s - 1; }), 1000);
    return () => clearInterval(t);
  }, []);

  const m = Math.floor(secs / 60), s = secs % 60;
  return (
    <span className={secs < 60 ? "text-red-500 font-bold text-lg" : "text-gray-700 text-lg"}>
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

export default function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"error" | "success" | "info">("info");
  const router = useRouter();

  useEffect(() => { params.then((p) => setId(p.id)); }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/reservations/${id}`)
      .then((r) => r.json())
      .then(setReservation)
      .finally(() => setLoading(false));
  }, [id]);

  const onExpire = useCallback(() => {
    setReservation((r) => r ? { ...r, status: "RELEASED" } : null);
    setMsgType("error");
    setMessage("Your reservation has expired.");
  }, []);

  async function confirm() {
    const res = await fetch(`/api/reservations/${id}/confirm`, { method: "POST" });
    const data = await res.json();
    if (res.status === 410) { setMsgType("error"); setMessage("Reservation expired before payment."); setReservation((r) => r ? { ...r, status: "RELEASED" } : null); return; }
    if (!res.ok) { setMsgType("error"); setMessage(data.error); return; }
    setReservation(data);
    setMsgType("success");
    setMessage("Purchase confirmed! Thank you.");
  }

  async function cancel() {
    const res = await fetch(`/api/reservations/${id}/release`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { setMsgType("error"); setMessage(data.error); return; }
    setReservation(data);
    setMsgType("info");
    setMessage("Reservation cancelled. Stock released.");
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!reservation) return <div className="p-8 text-red-500">Reservation not found.</div>;

  const msgColors = { error: "bg-red-50 border-red-200 text-red-800", success: "bg-green-50 border-green-200 text-green-800", info: "bg-blue-50 border-blue-200 text-blue-800" };

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Reservation</h1>
      <div className="border rounded-xl p-6 space-y-4 shadow-sm">
        <div><p className="text-xs text-gray-400 uppercase tracking-wide">Product</p><p className="font-semibold mt-0.5">{reservation.product.name}</p></div>
        <div><p className="text-xs text-gray-400 uppercase tracking-wide">Warehouse</p><p className="mt-0.5">{reservation.warehouse.name} — {reservation.warehouse.location}</p></div>
        <div><p className="text-xs text-gray-400 uppercase tracking-wide">Quantity</p><p className="mt-0.5">{reservation.quantity}</p></div>
        <div><p className="text-xs text-gray-400 uppercase tracking-wide">Status</p><p className="mt-0.5 font-medium capitalize">{reservation.status.toLowerCase()}</p></div>
        {reservation.status === "PENDING" && (
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">Time Remaining</p><div className="mt-0.5"><Countdown expiresAt={reservation.expiresAt} onExpire={onExpire} /></div></div>
        )}
      </div>

      {message && (
        <div className={`mt-4 p-3 border rounded-lg text-sm ${msgColors[msgType]}`}>{message}</div>
      )}

      {reservation.status === "PENDING" && (
        <div className="mt-6 flex gap-3">
          <button onClick={confirm} className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">Confirm Purchase</button>
          <button onClick={cancel} className="flex-1 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium">Cancel</button>
        </div>
      )}

      {reservation.status !== "PENDING" && (
        <button onClick={() => router.push("/")} className="mt-6 w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Back to Products</button>
      )}
    </main>
  );
}