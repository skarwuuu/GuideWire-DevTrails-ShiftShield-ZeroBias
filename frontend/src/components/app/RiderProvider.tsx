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

export function RiderProvider({ children }: { children: React.ReactNode }) {
  const [riderId, setRiderIdState] = useState<string | null>(null);
  const [profile, setProfile] = useState<RiderProfile | null>(null);

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
      loadProfile(stored);
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

  return (
    <Ctx.Provider value={{ riderId, profile, setRiderId, clearRider, refreshProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export const useRider = () => useContext(Ctx);
