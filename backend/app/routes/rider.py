from datetime import datetime, timezone
from uuid import uuid4
from fastapi import APIRouter, HTTPException
from app.database import get_db
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/rider", tags=["Rider"])

class RegisterRiderRequest(BaseModel):
    name: str
    phone: str
    pincode: str
    city: str
    zone_type: str = "metro_suburb"  # metro_core, metro_suburb, tier2, rural
    vehicle_type: str = "bike"
    upi_id: Optional[str] = None

def _new_rider_id() -> str:
    return f"RDR-{uuid4().hex[:8].upper()}"

@router.post("/register", status_code=201)
async def register_rider(body: RegisterRiderRequest):
    if not body.pincode.isdigit() or len(body.pincode) != 6:
        raise HTTPException(status_code=400, detail="pincode must be 6 digits")
    if not body.phone.isdigit() or len(body.phone) != 10:
        raise HTTPException(status_code=400, detail="phone must be 10 digits")

    db = get_db()

    existing = await db.riders.find_one({"phone": body.phone})
    if existing:
        raise HTTPException(status_code=409, detail=f"Rider with phone {body.phone} already registered")

    rider_id = _new_rider_id()
    now = datetime.now(timezone.utc)

    doc = {
        "rider_id":     rider_id,
        "name":         body.name,
        "phone":        body.phone,
        "pincode":      body.pincode,
        "city":         body.city,
        "zone_type":    body.zone_type,
        "vehicle_type": body.vehicle_type,
        "upi_id":       body.upi_id,
        "status":       "ACTIVE",
        "created_at":   now,
    }
    await db.riders.insert_one(doc)

    return {
        "rider_id":   rider_id,
        "name":       body.name,
        "phone":      body.phone,
        "zone_type":  body.zone_type,
        "status":     "ACTIVE",
        "created_at": now.isoformat(),
        "message":    "Rider registered successfully.",
    }

@router.get("/{rider_id}")
async def get_rider(rider_id: str):
    db  = get_db()
    doc = await db.riders.find_one({"rider_id": rider_id})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Rider {rider_id} not found")

    return {
        "rider_id":     doc["rider_id"],
        "name":         doc["name"],
        "phone":        doc["phone"],
        "pincode":      doc["pincode"],
        "city":         doc["city"],
        "zone_type":    doc["zone_type"],
        "vehicle_type": doc["vehicle_type"],
        "upi_id":       doc.get("upi_id"),
        "status":       doc["status"],
        "created_at":   doc["created_at"].isoformat(),
    }