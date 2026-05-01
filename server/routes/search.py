from __future__ import annotations

import asyncio
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from server.agents.tools.flights_amadeus import google_search_flights
from server.agents.tools.hotels_amadeus import google_search_hotels


router = APIRouter()


class FlightSearchRequest(BaseModel):
    origin: str
    destination: str
    departure_date: str
    return_date: str | None = None
    adults: int = 1
    currency: str = "USD"
    max_results: int = 10


class HotelSearchRequest(BaseModel):
    destination: str
    check_in: str
    check_out: str
    adults: int = 1
    max_results: int = 10


@router.post("/api/search/flights")
async def search_flights(body: FlightSearchRequest) -> dict[str, Any]:
    return await asyncio.to_thread(google_search_flights, body.model_dump(exclude_none=True))


@router.post("/api/search/hotels")
async def search_hotels(body: HotelSearchRequest) -> dict[str, Any]:
    return await asyncio.to_thread(google_search_hotels, body.model_dump(exclude_none=True))
