"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useRider } from "@/components/app/RiderProvider";
import { api, type ClaimResult } from "@/lib/api";
import {
  IconLoader2,
  IconShieldCheck,
  IconShieldOff,
  IconAlertTriangle,
} from "@tabler/icons-react";

const SIGNAL_LABELS: Record<string, string> = {
  weather: "Weather",
  activity: "App Activity",
  rank: "Rank Drop",
  shift: "Shift Impact",
  disruption: "Disruption",
};

function ClaimResultCard({ result }: { result: ClaimResult }) {
  const { scoring, decision, payout } = result;

  return (
    <div className="bg-foreground text-background rounded-2xl overflow-hidden">
      <div className="px-7 pt-7 pb-5 border-b border-background/10 flex items-start justify-between">
        <div>
          <p className="font-mono text-[9px] tracking-widest uppercase text-background/30 mb-1">
            Claim ID
          </p>
          <h2 className="font-sans font-black text-xl">{result.claim_id}</h2>
          <p className="font-mono text-[9px] text-background/30 tracking-wide mt-1">
            {result.shift_id}
          </p>
        </div>
        {payout.eligible ? (
          <IconShieldCheck size={28} className="text-accent shrink-0" />
        ) : (
          <IconShieldOff size={28} className="text-background/30 shrink-0" />
        )}
      </div>

      <div className="px-7 py-5 border-b border-background/10">
        <p className="font-mono text-[9px] tracking-widest uppercase text-background/30 mb-3">
          Signals Triggered ({scoring.signals_triggered}/5)
        </p>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(scoring.signals).map(([key, triggered]) => (
            <div
              key={key}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-mono tracking-wide ${
                triggered
                  ? "border-accent/40 text-accent bg-accent/8"
                  : "border-background/15 text-background/30"
              }`}
            >
              <span
                className={`w-1 h-1 rounded-full ${
                  triggered ? "bg-accent" : "bg-background/25"
                }`}
              />
              {SIGNAL_LABELS[key] ?? key}
            </div>
          ))}
        </div>
      </div>

      <div className="px-7 py-5 border-b border-background/10 grid grid-cols-2 gap-4">
        <div>
          <p className="font-mono text-[9px] tracking-widest uppercase text-background/30 mb-1">
            Confidence
          </p>
          <p className="font-sans font-black text-3xl">
            {(scoring.confidence_score * 100).toFixed(0)}
            <span className="text-background/30 text-lg font-normal">%</span>
          </p>
        </div>
        <div>
          <p className="font-mono text-[9px] tracking-widest uppercase text-background/30 mb-1">
            ML Score
          </p>
          <p className="font-sans font-black text-3xl">
            {(scoring.ml_raw_score * 100).toFixed(0)}
            <span className="text-background/30 text-lg font-normal">%</span>
          </p>
        </div>
      </div>

      <div className="px-7 py-5 border-b border-background/10">
        <p className="font-mono text-[9px] tracking-widest uppercase text-background/30 mb-2">
          Decision
        </p>
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`font-sans font-black text-lg ${
              decision.decision === "APPROVED"
                ? "text-accent"
                : decision.decision === "REJECTED"
                ? "text-red-400"
                : "text-yellow-400"
            }`}
          >
            {decision.decision}
          </span>
          {decision.requires_manual_review && (
            <IconAlertTriangle size={14} className="text-yellow-400" />
          )}
        </div>
        <p className="text-background/50 text-sm leading-relaxed">
          {decision.reason}
        </p>
      </div>

      <div className="px-7 py-6">
        <p className="font-mono text-[9px] tracking-widest uppercase text-background/30 mb-3">
          Payout
        </p>
        {payout.eligible ? (
          <div>
            <div className="font-black text-5xl leading-none text-accent mb-2">
              ₹{payout.final_amount.toFixed(0)}
            </div>
            <p className="font-mono text-[9px] text-background/30 tracking-widest uppercase mb-1">
              Base ₹{payout.base_amount} × {payout.disruption_multiplier}x
              multiplier
            </p>
            {payout.upi_ref && (
              <p className="font-mono text-[9px] text-emerald-400 tracking-widest uppercase mt-2">
                UPI Ref: {payout.upi_ref} · {payout.transfer_status}
              </p>
            )}
          </div>
        ) : (
          <p className="text-background/40 text-sm">Not eligible for payout.</p>
        )}
      </div>
    </div>
  );
}

function ClaimForm() {
  const { riderId } = useRider();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState({
    shift_id: searchParams.get("shift_id") ?? "",
    pincode: searchParams.get("pincode") ?? "",
    shift_start: searchParams.get("shift_start") ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ClaimResult | null>(null);

  useEffect(() => {
    if (!riderId) router.push("/app");
  }, [riderId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!riderId) return;
    setError("");
    setLoading(true);
    try {
      const res = await api.claim.evaluate({
        shift_id: form.shift_id.trim().toUpperCase(),
        rider_id: riderId,
        pincode: form.pincode.trim(),
        shift_start: form.shift_start || new Date().toISOString(),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <p className="font-mono text-[9px] tracking-widest uppercase text-foreground/35 mb-2">
          Claim Evaluation
        </p>
        <h1 className="font-sans font-black text-3xl tracking-tight leading-none">
          {result ? "Claim Result" : "Evaluate Claim"}
        </h1>
      </div>

      {!result ? (
        <div className="bg-foreground text-background rounded-2xl p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: "shift_id", label: "Shift ID", placeholder: "SHF-XXXXXXXX" },
              { key: "pincode", label: "Pincode", placeholder: "600042" },
              {
                key: "shift_start",
                label: "Shift Start (ISO, optional)",
                placeholder: new Date().toISOString().slice(0, 19),
              },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="font-mono text-[9px] tracking-widest uppercase text-background/40 block mb-1.5">
                  {label}
                </label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  placeholder={placeholder}
                  required={key !== "shift_start"}
                  className="w-full bg-background/10 border border-background/20 rounded-lg px-3 py-2.5 text-background placeholder:text-background/25 focus:outline-none focus:border-accent/60 text-sm font-mono"
                />
              </div>
            ))}
            {error && (
              <p className="text-red-400 font-mono text-[10px] tracking-wide">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !form.shift_id || !form.pincode}
              className="primary-btn w-full justify-center py-3 disabled:opacity-40"
            >
              {loading ? (
                <IconLoader2 size={16} className="animate-spin" />
              ) : (
                "Evaluate Claim"
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-3">
          <ClaimResultCard result={result} />
          <button
            onClick={() => setResult(null)}
            className="w-full border border-foreground/15 rounded-xl py-3 text-sm font-mono tracking-widest uppercase text-foreground/40 hover:text-foreground/60 transition-colors cursor-pointer"
          >
            Evaluate Another
          </button>
        </div>
      )}
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <IconLoader2 size={24} className="animate-spin text-foreground/30" />
        </div>
      }
    >
      <ClaimForm />
    </Suspense>
  );
}
