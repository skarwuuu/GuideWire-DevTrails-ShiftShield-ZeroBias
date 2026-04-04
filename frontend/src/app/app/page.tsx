"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRider } from "@/components/app/RiderProvider";
import { api, type Shift } from "@/lib/api";
import {
  IconActivity,
  IconCalculator,
  IconFileCheck,
  IconShieldCheck,
  IconShieldOff,
  IconLoader2,
} from "@tabler/icons-react";

type Tab = "login" | "register";

function OnboardingView({ onRiderId }: { onRiderId: (id: string) => void }) {
  const [tab, setTab] = useState<Tab>("login");
  const [loginId, setLoginId] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    pincode: "",
    city: "",
    zone_type: "metro_suburb",
    vehicle_type: "bike",
    upi_id: "",
  });
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      await api.rider.get(loginId.trim().toUpperCase());
      onRiderId(loginId.trim().toUpperCase());
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Rider not found");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    setRegLoading(true);
    try {
      const res = await api.rider.register({
        ...form,
        upi_id: form.upi_id || undefined,
      });
      onRiderId(res.rider_id);
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto pt-8">
      <div className="mb-8">
        <p className="font-mono text-[9px] tracking-widest uppercase text-foreground/35 mb-3">
          Welcome
        </p>
        <h1 className="font-sans font-black text-4xl tracking-tight leading-none">
          Get covered.
          <br />
          <span className="text-foreground/30 font-light">Before it rains.</span>
        </h1>
      </div>

      <div className="bg-foreground text-background rounded-2xl overflow-hidden">
        <div className="flex border-b border-background/10">
          {(["login", "register"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3.5 font-mono text-[9px] tracking-widest uppercase transition-colors cursor-pointer ${
                tab === t
                  ? "text-accent border-b-2 border-accent"
                  : "text-background/35 hover:text-background/60"
              }`}
            >
              {t === "login" ? "Enter Rider ID" : "New Rider"}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === "login" ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="font-mono text-[9px] tracking-widest uppercase text-background/40 block mb-1.5">
                  Rider ID
                </label>
                <input
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="RDR-XXXXXXXX"
                  required
                  className="w-full bg-background/10 border border-background/20 rounded-lg px-3 py-2.5 text-background placeholder:text-background/25 focus:outline-none focus:border-accent/60 text-sm font-mono tracking-wider"
                />
              </div>
              {loginError && (
                <p className="text-red-400 font-mono text-[10px] tracking-wide">
                  {loginError}
                </p>
              )}
              <button
                type="submit"
                disabled={loginLoading || !loginId.trim()}
                className="primary-btn justify-center w-full py-2.5 disabled:opacity-40"
              >
                {loginLoading ? (
                  <IconLoader2 size={16} className="animate-spin" />
                ) : (
                  "Enter App"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              {[
                { key: "name", label: "Full Name", placeholder: "Ravi Kumar" },
                { key: "phone", label: "Phone (10 digits)", placeholder: "9876543210" },
                { key: "pincode", label: "Pincode", placeholder: "600042" },
                { key: "city", label: "City", placeholder: "Chennai" },
                { key: "upi_id", label: "UPI ID (optional)", placeholder: "ravi@upi" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="font-mono text-[9px] tracking-widest uppercase text-background/40 block mb-1">
                    {label}
                  </label>
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    placeholder={placeholder}
                    required={key !== "upi_id"}
                    className="w-full bg-background/10 border border-background/20 rounded-lg px-3 py-2 text-background placeholder:text-background/25 focus:outline-none focus:border-accent/60 text-sm"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[9px] tracking-widest uppercase text-background/40 block mb-1">
                    Zone
                  </label>
                  <select
                    value={form.zone_type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, zone_type: e.target.value }))
                    }
                    className="w-full bg-background/10 border border-background/20 rounded-lg px-3 py-2 text-background focus:outline-none focus:border-accent/60 text-sm"
                  >
                    <option value="metro_core">Metro Core</option>
                    <option value="metro_suburb">Metro Suburb</option>
                    <option value="tier2">Tier 2</option>
                    <option value="rural">Rural</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[9px] tracking-widest uppercase text-background/40 block mb-1">
                    Vehicle
                  </label>
                  <select
                    value={form.vehicle_type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, vehicle_type: e.target.value }))
                    }
                    className="w-full bg-background/10 border border-background/20 rounded-lg px-3 py-2 text-background focus:outline-none focus:border-accent/60 text-sm"
                  >
                    <option value="bike">Bike</option>
                    <option value="scooter">Scooter</option>
                    <option value="cycle">Cycle</option>
                    <option value="car">Car</option>
                  </select>
                </div>
              </div>
              {regError && (
                <p className="text-red-400 font-mono text-[10px] tracking-wide">
                  {regError}
                </p>
              )}
              <button
                type="submit"
                disabled={regLoading}
                className="primary-btn justify-center w-full py-2.5 mt-1 disabled:opacity-40"
              >
                {regLoading ? (
                  <IconLoader2 size={16} className="animate-spin" />
                ) : (
                  "Register & Enter"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardView() {
  const { riderId, profile } = useRider();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [shiftLoading, setShiftLoading] = useState(true);

  const fetchActiveShift = useCallback(async () => {
    if (!riderId) return;
    try {
      const shift = await api.shift.active(riderId);
      setActiveShift(shift);
    } catch {
      setActiveShift(null);
    } finally {
      setShiftLoading(false);
    }
  }, [riderId]);

  useEffect(() => {
    fetchActiveShift();
  }, [fetchActiveShift]);

  return (
    <div className="space-y-4">
      {/* Rider header */}
      <div className="bg-foreground text-background rounded-2xl p-6 flex items-start justify-between">
        <div>
          <p className="font-mono text-[9px] tracking-widest uppercase text-background/30 mb-2">
            Rider Profile
          </p>
          <h1 className="font-sans font-black text-2xl mb-1">
            {profile?.name ?? riderId}
          </h1>
          <p className="font-mono text-[10px] text-background/35 tracking-wide">
            {riderId}
          </p>
          {profile && (
            <p className="font-mono text-[9px] text-background/30 tracking-widest uppercase mt-1">
              {profile.city} · {profile.zone_type.replace("_", " ")} ·{" "}
              {profile.vehicle_type}
            </p>
          )}
        </div>
        <span className="font-mono text-[9px] tracking-widest uppercase border border-background/15 rounded-full px-3 py-1 text-background/40">
          Active
        </span>
      </div>

      {/* Active shift status */}
      <div
        className={`rounded-2xl p-6 border transition-all ${
          shiftLoading
            ? "bg-foreground/5 border-foreground/10 animate-pulse"
            : activeShift
            ? "bg-foreground text-background border-foreground"
            : "bg-foreground/5 border-foreground/10"
        }`}
      >
        {shiftLoading ? (
          <div className="h-16" />
        ) : activeShift ? (
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <p className="font-mono text-[9px] tracking-widest uppercase text-background/35">
                  Coverage Active
                </p>
              </div>
              <h2 className="font-sans font-black text-xl text-background mb-1">
                {activeShift.shift_id}
              </h2>
              <p className="font-mono text-[9px] text-background/35 tracking-wide">
                Pincode {activeShift.pincode} · Started{" "}
                {new Date(activeShift.shift_start).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <IconShieldCheck size={28} className="text-accent shrink-0" />
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[9px] tracking-widest uppercase text-foreground/30 mb-2">
                No Active Shift
              </p>
              <p className="text-foreground/50 text-sm">
                Start a shift to activate coverage.
              </p>
            </div>
            <IconShieldOff size={24} className="text-foreground/20 shrink-0" />
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            href: "/app/shift",
            label: "Manage Shift",
            desc: activeShift ? "End shift / monitor" : "Start coverage now",
            Icon: IconActivity,
            highlight: !!activeShift,
          },
          {
            href: "/app/claim",
            label: "Evaluate Claim",
            desc: "Check payout eligibility",
            Icon: IconFileCheck,
            highlight: false,
          },
          {
            href: "/app/quote",
            label: "Get Quote",
            desc: "See your premium",
            Icon: IconCalculator,
            highlight: false,
          },
        ].map(({ href, label, desc, Icon, highlight }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-2xl p-5 border flex flex-col gap-3 transition-colors group ${
              highlight
                ? "bg-foreground text-background border-foreground"
                : "border-foreground/10 hover:border-foreground/25"
            }`}
          >
            <Icon
              size={18}
              className={
                highlight
                  ? "text-accent"
                  : "text-foreground/35 group-hover:text-foreground/55 transition-colors"
              }
            />
            <div>
              <p
                className={`font-sans font-bold text-sm ${
                  highlight ? "text-background" : "text-foreground/65"
                }`}
              >
                {label}
              </p>
              <p
                className={`font-mono text-[9px] tracking-wide mt-0.5 ${
                  highlight ? "text-background/40" : "text-foreground/30"
                }`}
              >
                {desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function AppPage() {
  const { riderId, setRiderId } = useRider();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <IconLoader2 size={24} className="animate-spin text-foreground/30" />
      </div>
    );
  }

  if (!riderId) return <OnboardingView onRiderId={setRiderId} />;
  return <DashboardView />;
}
