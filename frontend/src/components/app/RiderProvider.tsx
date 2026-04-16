"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, type RiderProfile } from "@/lib/api";

interface RiderCtx {
  riderId: string | null;
  profile: RiderProfile | null;
  setRiderId: (id: string) => void;
  clearRider: () => void;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<RiderCtx>({
  riderId: null,
  profile: null,
  setRiderId: () => {},
  clearRider: () => {},
  refreshProfile: async () => {},
});

function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background gap-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-pulse text-primary"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M13.018 20.687c-.333 .119 -.673 .223 -1.018 .313a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3a12 12 0 0 0 8.5 3c.433 1.472 .575 2.998 .436 4.495" />
        <path d="M21 15h-2.5a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3h-2.5" />
        <path d="M19 21v1m0 -8v1" />
      </svg>
      <span className="text-sm text-muted-foreground tracking-widest uppercase">ShiftShield</span>
    </div>
  );
}

export function RiderProvider({ children }: { children: React.ReactNode }) {
  const [riderId, setRiderIdState] = useState<string | null>(null);
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (id: string) => {
    try {
      const p = await api.rider.get(id);
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("shiftshield_rider_id");
    if (stored) {
      setRiderIdState(stored);
      loadProfile(stored).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [loadProfile]);

  const setRiderId = useCallback(
    (id: string) => {
      localStorage.setItem("shiftshield_rider_id", id);
      setRiderIdState(id);
      loadProfile(id);
    },
    [loadProfile]
  );

  const clearRider = useCallback(() => {
    localStorage.removeItem("shiftshield_rider_id");
    setRiderIdState(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (riderId) await loadProfile(riderId);
  }, [riderId, loadProfile]);

  if (loading) return <SplashScreen />;

  return (
    <Ctx.Provider value={{ riderId, profile, setRiderId, clearRider, refreshProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export const useRider = () => useContext(Ctx);
