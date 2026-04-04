const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail)
    );
  }
  return res.json() as Promise<T>;
}

export interface RiderProfile {
  rider_id: string;
  name: string;
  phone: string;
  pincode: string;
  city: string;
  zone_type: string;
  vehicle_type: string;
  upi_id?: string;
  status: string;
  created_at: string;
}

export interface Shift {
  shift_id: string;
  rider_id: string;
  pincode: string;
  shift_start: string;
  status: string;
  message?: string;
}

export interface ClaimResult {
  claim_id: string;
  shift_id: string;
  rider_id: string;
  scoring: {
    confidence_score: number;
    signals_triggered: number;
    all_five_triggered: boolean;
    ml_raw_score: number;
    signals: {
      weather: boolean;
      activity: boolean;
      rank: boolean;
      shift: boolean;
      disruption: boolean;
    };
  };
  decision: {
    decision: string;
    reason: string;
    requires_manual_review: boolean;
  };
  payout: {
    eligible: boolean;
    base_amount: number;
    disruption_multiplier: number;
    final_amount: number;
    upi_ref: string | null;
    transfer_status: string;
    notified: boolean;
  };
  evaluated_at: string;
}

export interface PremiumQuote {
  pincode: string;
  zone_type: string;
  vehicle_type: string;
  coverage_days: number;
  disruption_tier: string;
  premium_inr: number;
  max_payout_inr: number;
  breakdown: {
    base_daily: number;
    vehicle_multiplier: number;
    risk_multiplier: number;
  };
  message: string;
}

export const api = {
  rider: {
    register: (data: {
      name: string;
      phone: string;
      pincode: string;
      city: string;
      zone_type: string;
      vehicle_type: string;
      upi_id?: string;
    }) =>
      req<RiderProfile & { message: string }>("/rider/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: (riderId: string) => req<RiderProfile>(`/rider/${riderId}`),
  },
  shift: {
    start: (data: { rider_id: string; pincode: string }) =>
      req<Shift>("/shift/start", { method: "POST", body: JSON.stringify(data) }),
    end: (data: { shift_id: string; rider_id: string }) =>
      req<{ shift_id: string; status: string; message: string }>("/shift/end", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    active: (riderId: string) => req<Shift>(`/shift/${riderId}/active`),
  },
  claim: {
    evaluate: (data: {
      shift_id: string;
      rider_id: string;
      pincode: string;
      shift_start: string;
    }) =>
      req<ClaimResult>("/claim/evaluate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    status: (claimId: string) =>
      req<{ claim_id: string; status: string }>(`/claim/${claimId}/status`),
  },
  premium: {
    quote: (data: {
      pincode: string;
      zone_type: string;
      vehicle_type: string;
      coverage_days: number;
      rider_id?: string;
    }) =>
      req<PremiumQuote>("/premium/quote", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
};
