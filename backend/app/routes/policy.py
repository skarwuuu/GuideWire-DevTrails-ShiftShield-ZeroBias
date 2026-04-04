from datetime import datetime, timezone, timedelta
from uuid import uuid4
from fastapi import APIRouter, HTTPException
from app.database import get_db
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/policy", tags=["Policy"])

# Premium rates by zone tier (weekly, INR)
_ZONE_PREMIUMS = {
    "metro_core":   49,
    "metro_suburb": 39,
    "tier2":        29,
    "rural":        19,
}

def _new_policy_id() -> str:
    return f"POL-{uuid4().hex[:8].upper()}"

class CreatePolicyRequest(BaseModel):
    rider_id: str
    zone_type: Optional[str] = None   # overrides rider's zone if provided

@router.post("/create", status_code=201)
async def create_policy(body: CreatePolicyRequest):
    db = get_db()

    # Rider must exist
    rider = await db.riders.find_one({"rider_id": body.rider_id})
    if not rider:
        raise HTTPException(status_code=404, detail=f"Rider {body.rider_id} not found")

    # Block duplicate active policy
    existing = await db.policies.find_one({
        "rider_id": body.rider_id,
        "status":   "ACTIVE"
    })
    if existing:
        raise HTTPException(status_code=409, detail=f"Rider already has active policy: {existing['policy_id']}")

    zone_type   = body.zone_type or rider.get("zone_type", "metro_suburb")
    premium_inr = _ZONE_PREMIUMS.get(zone_type, 39)

    now        = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=7)
    policy_id  = _new_policy_id()

    doc = {
        "policy_id":   policy_id,
        "rider_id":    body.rider_id,
        "zone_type":   zone_type,
        "premium_inr": premium_inr,
        "status":      "ACTIVE",
        "created_at":  now,
        "expires_at":  expires_at,
    }
    await db.policies.insert_one(doc)

    return {
        "policy_id":   policy_id,
        "rider_id":    body.rider_id,
        "zone_type":   zone_type,
        "premium_inr": premium_inr,
        "status":      "ACTIVE",
        "created_at":  now.isoformat(),
        "expires_at":  expires_at.isoformat(),
        "message":     f"Policy active for 7 days. Premium: ₹{premium_inr}/week.",
    }

@router.get("/{rider_id}/active")
async def get_active_policy(rider_id: str):
    db  = get_db()
    doc = await db.policies.find_one({"rider_id": rider_id, "status": "ACTIVE"})
    if not doc:
        raise HTTPException(status_code=404, detail=f"No active policy for rider {rider_id}")

    # Auto-expire if past expiry
    if datetime.now(timezone.utc) > doc["expires_at"]:
        await db.policies.update_one(
            {"policy_id": doc["policy_id"]},
            {"$set": {"status": "EXPIRED"}}
        )
        raise HTTPException(status_code=404, detail="Policy has expired. Please renew.")

    return {
        "policy_id":   doc["policy_id"],
        "rider_id":    doc["rider_id"],
        "zone_type":   doc["zone_type"],
        "premium_inr": doc["premium_inr"],
        "status":      doc["status"],
        "expires_at":  doc["expires_at"].isoformat(),
    }

@router.post("/{policy_id}/cancel")
async def cancel_policy(policy_id: str):
    db  = get_db()
    doc = await db.policies.find_one({"policy_id": policy_id})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Policy {policy_id} not found")
    if doc["status"] != "ACTIVE":
        raise HTTPException(status_code=409, detail=f"Policy already {doc['status']}")

    await db.policies.update_one(
        {"policy_id": policy_id},
        {"$set": {"status": "CANCELLED"}}
    )
    return {"policy_id": policy_id, "status": "CANCELLED", "message": "Policy cancelled."}