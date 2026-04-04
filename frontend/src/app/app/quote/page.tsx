"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRider } from "@/components/app/RiderProvider";
import { api, type PremiumQuote } from "@/lib/api";
import { IconLoader2, IconShieldCheck } from "@tabler/icons-react";

const DISRUPTION_COLOR: Record<string, string> = {
  LOW: "text-emerald-400",
  MEDIUM: "text-yellow-400",
  HIGH: "text-red-400",
};

function QuoteCard({ quote }: { quote: PremiumQuote }) {
  return (
    <div className="bg-foreground text-background rounded-2xl overflow-hidden">
      <div className="px-7 pt-7 pb-5 border-b border-background/10 flex items-start justify-between">
        <div>
          <p className="font-mono text-[9px] tracking-widest uppercase text-background/30 mb-1">
            Premium Quote · {quote.coverage_days}d Coverage
          </p>
          <div className="font-black text-5xl leading-none mt-2">
            ₹{quote.premium_inr}
          </div>
        </div>
        <IconShieldCheck size={28} className="text-accent shrink-0" />
      </div>

      <div className="px-7 py-5 grid grid-cols-2 gap-4 border-b border-background/10">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-background/30 mb-1">
            Max Payout
          </p>
          <p className="font-sans font-black text-2xl text-accent">
            ₹{quote.max_payout_inr}
          </p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-background/30 mb-1">
            Risk Tier
          </p>
          <p
            className={`font-sans font-black text-2xl ${
              DISRUPTION_COLOR[quote.disruption_tier] ?? "text-background"
            }`}
          >
            {quote.disruption_tier}
          </p>
        </div>
      </div>

      <div className="px-7 py-5 space-y-2.5 border-b border-background/10">
        <p className="font-mono text-[9px] uppercase tracking-widest text-background/30 mb-3">
          Breakdown
        </p>
        {[
          { label: "Base daily rate", value: `₹${quote.breakdown.base_daily}` },
          { label: "Vehicle multiplier", value: `${quote.breakdown.vehicle_multiplier}×` },
          { label: "Risk multiplier", value: `${quote.breakdown.risk_multiplier}×` },
          { label: "Coverage days", value: `${quote.coverage_days}` },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-background/45">{label}</span>
            <span className="font-mono text-background/70">{value}</span>
          </div>
        ))}
      </div>

      <div className="px-7 pb-7 pt-5">
        <p className="text-background/35 text-xs leading-relaxed">{quote.message}</p>
      </div>
    </div>
  );
}

export default function QuotePage() {
  const { riderId, profile } = useRider();
  const router = useRouter();

  const [form, setForm] = useState({
    pincode: "",
    zone_type: "metro_suburb",
    vehicle_type: "bike",
    coverage_days: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<PremiumQuote | null>(null);

  useEffect(() => {
    if (!riderId) router.push("/app");
  }, [riderId, router]);

  useEffect(() => {
    if (profile) {
      setForm((f) => ({
        ...f,
        pincode: profile.pincode || f.pincode,
        zone_type: profile.zone_type || f.zone_type,
        vehicle_type: profile.vehicle_type || f.vehicle_type,
      }));
    }
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!riderId) return;
    setError("");
    setLoading(true);
    try {
      const res = await api.premium.quote({ ...form, rider_id: riderId });
      setQuote(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get quote");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <p className="font-mono text-[9px] tracking-widest uppercase text-foreground/35 mb-2">
          Premium Calculator
        </p>
        <h1 className="font-sans font-black text-3xl tracking-tight leading-none">
          {quote ? "Your Quote" : "Get a Quote"}
        </h1>
      </div>

      {!quote ? (
        <div className="bg-foreground text-background rounded-2xl p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-mono text-[9px] tracking-widest uppercase text-background/40 block mb-1.5">
                Pincode
              </label>
              <input
                value={form.pincode}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                  }))
                }
                placeholder="600042"
                required
                maxLength={6}
                className="w-full bg-background/10 border border-background/20 rounded-lg px-3 py-2.5 text-background placeholder:text-background/25 focus:outline-none focus:border-accent/60 text-sm font-mono tracking-widest"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[9px] tracking-widest uppercase text-background/40 block mb-1.5">
                  Zone
                </label>
                <select
                  value={form.zone_type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, zone_type: e.target.value }))
                  }
                  className="w-full bg-background/10 border border-background/20 rounded-lg px-3 py-2.5 text-background focus:outline-none focus:border-accent/60 text-sm"
                >
                  <option value="metro_core">Metro Core</option>
                  <option value="metro_suburb">Metro Suburb</option>
                  <option value="tier2">Tier 2</option>
                  <option value="rural">Rural</option>
                </select>
              </div>
              <div>
                <label className="font-mono text-[9px] tracking-widest uppercase text-background/40 block mb-1.5">
                  Vehicle
                </label>
                <select
                  value={form.vehicle_type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vehicle_type: e.target.value }))
                  }
                  className="w-full bg-background/10 border border-background/20 rounded-lg px-3 py-2.5 text-background focus:outline-none focus:border-accent/60 text-sm"
                >
                  <option value="bike">Bike</option>
                  <option value="scooter">Scooter</option>
                  <option value="cycle">Cycle</option>
                  <option value="car">Car</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-mono text-[9px] tracking-widest uppercase text-background/40 block mb-1.5">
                Coverage Days
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 3, 7].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, coverage_days: d }))}
                    className={`py-2.5 rounded-lg border font-mono text-sm font-bold transition-colors cursor-pointer ${
                      form.coverage_days === d
                        ? "border-accent/60 text-accent bg-accent/10"
                        : "border-background/20 text-background/40 hover:border-background/35"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-red-400 font-mono text-[10px] tracking-wide">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || form.pincode.length !== 6}
              className="primary-btn w-full justify-center py-3 disabled:opacity-40"
            >
              {loading ? (
                <IconLoader2 size={16} className="animate-spin" />
              ) : (
                "Get Quote"
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-3">
          <QuoteCard quote={quote} />
          <button
            onClick={() => setQuote(null)}
            className="w-full border border-foreground/15 rounded-xl py-3 text-sm font-mono tracking-widest uppercase text-foreground/40 hover:text-foreground/60 transition-colors cursor-pointer"
          >
            New Quote
          </button>
        </div>
      )}
    </div>
  );
}
