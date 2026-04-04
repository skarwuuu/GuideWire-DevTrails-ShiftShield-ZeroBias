# M1 Weather Engine
import os
import requests
from dotenv import load_dotenv
from app.schemas import WeatherSignal, WeatherSeverity
from app.config import settings
load_dotenv()

API_KEY = settings.openweather_api_key or os.getenv("OPENWEATHER_API_KEY", "")
def get_lat_lon_from_pincode(pincode: str):
    url = f"http://api.openweathermap.org/geo/1.0/zip?zip={pincode},IN&appid={API_KEY}"
    response = requests.get(url, timeout=10)
    data = response.json()
    return data.get("lat"), data.get("lon")
def _classify_severity(rainfall: float, wind: float, aqi: int) -> WeatherSeverity:
    if rainfall > 50 or aqi > 400 or wind > 80:
        return "EXTREME"
    if rainfall > 15 or aqi > 300 or wind > 50:
        return "SEVERE"
    if rainfall > 5 or aqi > 150 or wind > 30:
        return "MODERATE"
    return "CLEAR"
_SEVERITY_SCORE_RANGE: dict[WeatherSeverity, tuple[float, float]] = {
    "EXTREME":  (88.0, 100.0),
    "SEVERE":   (65.0,  87.0),
    "MODERATE": (35.0,  64.0),
    "CLEAR":    (0.0,   34.0),
}
def run_weather_engine(pincode: str) -> WeatherSignal:
    try:
        lat, lon = get_lat_lon_from_pincode(pincode)
        url = (
            f"https://api.openweathermap.org/data/2.5/weather"
            f"?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
        )
        response = requests.get(url, timeout=10)
        data = response.json()
        rainfall_mm    = round(data.get("rain", {}).get("1h", 0.0), 1)
        wind_speed_kmh = round(data.get("wind", {}).get("speed", 0.0) * 3.6, 1)
        aqi            = 50
        severity       = _classify_severity(rainfall_mm, wind_speed_kmh, aqi)
        lo, hi         = _SEVERITY_SCORE_RANGE[severity]
        score          = round((lo + hi) / 2, 2)
        triggered      = severity in ("SEVERE", "EXTREME")
        details = (
            f"Pincode {pincode}: {severity} - {rainfall_mm}mm/hr rain, "
            f"AQI {aqi}, wind {wind_speed_kmh}km/h"
            if triggered
            else f"Pincode {pincode}: {severity} - within normal delivery operating range"
        )
    except Exception as e:
        rainfall_mm    = 0.0
        wind_speed_kmh = 0.0
        aqi            = 0
        severity       = "CLEAR"
        score          = 0.0
        triggered      = False
        details        = f"Weather API error for pincode {pincode}: {str(e)}"
    return WeatherSignal(
        pincode=pincode,
        rainfall_mm=rainfall_mm,
        wind_speed_kmh=wind_speed_kmh,
        aqi=aqi,
        severity=severity,
        score=score,
        triggered=triggered,
        details=details,
    )
