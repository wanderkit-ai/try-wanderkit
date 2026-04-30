from __future__ import annotations

from typing import Any

import httpx

from ._shared import ToolDef
from ._travel_lookup import lookup_destination
from .flights_amadeus import AMADEUS_BASE_URL, _amadeus_token


def _parse_hotel_offer(item: dict[str, Any]) -> dict[str, Any]:
    hotel = item.get("hotel", {})
    offers = item.get("offers") or []
    first_offer = offers[0] if offers else {}
    return {
        "hotel_id": hotel.get("hotelId"),
        "name": hotel.get("name"),
        "city_code": hotel.get("cityCode"),
        "check_in": first_offer.get("checkInDate"),
        "check_out": first_offer.get("checkOutDate"),
        "room": first_offer.get("room", {}),
        "price": first_offer.get("price", {}),
        "policies": first_offer.get("policies", {}),
        "offer_count": len(offers),
    }


def amadeus_search_hotels(input: dict[str, Any]) -> dict[str, Any]:
    try:
        destination_info = lookup_destination(input.get("destination") or input.get("city_code"))
        city_code = str(input.get("city_code") or destination_info["city"]).upper()
        adults = int(input.get("adults") or input.get("guests") or 1)
        max_hotels = max(1, min(int(input.get("max_hotels") or 12), 40))
        check_in = input.get("check_in") or input.get("checkInDate")
        check_out = input.get("check_out") or input.get("checkOutDate")

        if not check_in or not check_out:
            return {"error": "check_in and check_out are required"}

        token = _amadeus_token()
        headers = {"Authorization": f"Bearer {token}"}
        with httpx.Client(timeout=30) as client:
            hotel_list_response = client.get(
                f"{AMADEUS_BASE_URL}/v1/reference-data/locations/hotels/by-city",
                params={
                    "cityCode": city_code,
                    "radius": int(input.get("radius") or 20),
                    "radiusUnit": input.get("radius_unit") or "KM",
                    "hotelSource": "ALL",
                },
                headers=headers,
            )
            if hotel_list_response.status_code >= 400:
                return {
                    "error": "Amadeus hotel list failed",
                    "status": hotel_list_response.status_code,
                    "details": hotel_list_response.text,
                }
            hotel_ids = [
                item.get("hotelId")
                for item in hotel_list_response.json().get("data", [])
                if item.get("hotelId")
            ][:max_hotels]
            if not hotel_ids:
                return {"city_code": city_code, "hotels": [], "count": 0, "source": "amadeus-test"}

            offers_response = client.get(
                f"{AMADEUS_BASE_URL}/v3/shopping/hotel-offers",
                params={
                    "hotelIds": ",".join(hotel_ids),
                    "adults": adults,
                    "checkInDate": check_in,
                    "checkOutDate": check_out,
                    "currency": input.get("currency") or "USD",
                    "bestRateOnly": "true",
                },
                headers=headers,
            )
        if offers_response.status_code >= 400:
            return {
                "error": "Amadeus hotel offers failed",
                "status": offers_response.status_code,
                "details": offers_response.text,
                "city_code": city_code,
                "hotel_ids": hotel_ids,
            }

        hotels = [_parse_hotel_offer(item) for item in offers_response.json().get("data", [])]
        return {
            "city_code": city_code,
            "check_in": check_in,
            "check_out": check_out,
            "hotels": hotels,
            "count": len(hotels),
            "source": "amadeus-test",
        }
    except Exception as exc:
        return {"error": str(exc) or "Amadeus hotel search failed"}


TOOLS: dict[str, ToolDef] = {
    "amadeus_search_hotels": ToolDef(
        name="amadeus_search_hotels",
        description="Search real Amadeus test hotel offers for a city and stay dates.",
        input_schema={
            "type": "object",
            "properties": {
                "destination": {"type": "string", "description": "Destination name or city code."},
                "city_code": {"type": "string", "description": "IATA city code."},
                "check_in": {"type": "string", "description": "YYYY-MM-DD check-in date."},
                "check_out": {"type": "string", "description": "YYYY-MM-DD check-out date."},
                "adults": {"type": "integer", "minimum": 1},
                "currency": {"type": "string", "default": "USD"},
                "max_hotels": {"type": "integer", "minimum": 1, "maximum": 40},
            },
            "required": ["destination", "check_in", "check_out"],
        },
        handler=amadeus_search_hotels,
    )
}

