"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRider } from "@/components/app/RiderProvider";
import { api, type Shift } from "@/lib/api";
import {
  IconShieldCheck,
  IconShieldOff,
  IconLoader2,
  IconMapPin,
  IconClock,
  IconArrowRight,
} from "@tabler/icons-react";

export default function ShiftPage() {
  const { riderId } = useRider();
  const router = useRouter();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [pincode, setPincode] = useState("");
  const [startLoading, setStartLoading] = useState(false);
  const [endLoading, setEndLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchActive = useCallback(async () => {
    if (!riderId) return;
    try {
      const s = await api.shift.active(riderId);
      setActiveShift(s);
    } catch {
      setActiveShift(null);
    } finally {
      setLoading(false);
    }
  }, [riderId]);

  useEffect(() => {
    if (!riderId) {
      router.push("/app");
      return;
    }
    fetchActive();
  }, [riderId, router, fetchActive]);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!riderId) return;
    setError("");
    setSuccess("");
    setStartLoading(true);
    try {
      const s = await api.shift.start({ rider_id: riderId, pincode });
      setActiveShift(s);
      setSuccess("Coverage activated. ShiftShield is monitoring your shift.");
      setPincode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start shift");
    } finally {
      setStartLoading(false);
    }
  }

  async function handleEnd() {
    if (!riderId || !activeShift) return;
    setError("");
    setSuccess("");
    setEndLoading(true);
    try {
      await api.shift.end({ shift_id: activeShift.shift_id, rider_id: riderId });
      setSuccess("Shift ended. Coverage deactivated.");
      setActiveShift(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end shift");
    } finally {
      setEndLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <IconLoader2 size={24} className="animate-spin text-foreground/30" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <p className="font-mono text-[9px] tracking-widest uppercase text-foreground/35 mb-2">
          Shift Management
        </p>
        <h1 className="font-sans font-black text-3xl tracking-tight leading-none">
          {activeShift ? "Coverage Active" : "Start Coverage"}
        </h1>
      </div>

      {activeShift ? (
        <div className="bg-foreground text-background rounded-2xl p-7 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="font-mono text-[9px] tracking-widest uppercase text-background/35">
                  Live
                </span>
              </div>
              <h2 className="font-sans font-black text-2xl">{activeShift.shift_id}</h2>
            </div>
            <IconShieldCheck size={32} className="text-accent" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background/8 rounded-xl p-4">
              <IconMapPin size={14} className="text-accent mb-2" />
              <p className="font-mono text-[9px] uppercase tracking-widest text-background/30 mb-1">
                Pincode
              </p>
              <p className="font-sans font-bold text-lg">{activeShift.pincode}</p>
            </div>
            <div className="bg-background/8 rounded-xl p-4">
              <IconClock size={14} className="text-accent mb-2" />
              <p className="font-mono text-[9px] uppercase tracking-widest text-background/30 mb-1">
                Started
              </p>
              <p className="font-sans font-bold text-lg">
                {new Date(activeShift.shift_start).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {(error || success) && (
            <p
              className={`font-mono text-[10px] tracking-wide ${
                error ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {error || success}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={handleEnd}
              disabled={endLoading}
              className="w-full bg-background/10 hover:bg-background/15 text-background border border-background/20 rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
            >
              {endLoading ? (
                <IconLoader2 size={16} className="animate-spin" />
              ) : (
                "End Shift"
              )}
            </button>
            <Link
              href={`/app/claim?shift_id=${activeShift.shift_id}&pincode=${activeShift.pincode}&shift_start=${encodeURIComponent(activeShift.shift_start)}`}
              className="w-full bg-accent/15 hover:bg-accent/20 text-accent border border-accent/30 rounded-xl py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              Evaluate Claim <IconArrowRight size={14} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-foreground text-background rounded-2xl p-7 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[9px] tracking-widest uppercase text-background/30 mb-2">
                No Active Coverage
              </p>
              <p className="text-background/50 text-sm leading-relaxed max-w-xs">
                Enter your pincode to activate parametric coverage for your
                current shift.
              </p>
            </div>
            <IconShieldOff size={28} className="text-background/20 shrink-0" />
          </div>

          {success && (
            <p className="text-emerald-400 font-mono text-[10px] tracking-wide">
              {success}
            </p>
          )}

          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label className="font-mono text-[9px] tracking-widest uppercase text-background/40 block mb-1.5">
                Pincode
              </label>
              <input
                value={pincode}
                onChange={(e) =>
                  setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="600042"
                required
                maxLength={6}
                pattern="\d{6}"
                className="w-full bg-background/10 border border-background/20 rounded-lg px-3 py-2.5 text-background placeholder:text-background/25 focus:outline-none focus:border-accent/60 text-sm font-mono tracking-widest"
              />
            </div>
            {error && (
              <p className="text-red-400 font-mono text-[10px] tracking-wide">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={startLoading || pincode.length !== 6}
              className="primary-btn w-full justify-center py-3 disabled:opacity-40"
            >
              {startLoading ? (
                <IconLoader2 size={16} className="animate-spin" />
              ) : (
                "Activate Coverage"
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
